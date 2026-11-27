const http = require('http')
const url = require('url')
const fs = require('fs')
const crypto = require('crypto')

const NoticiasBD = require('./database/NoticiasBD')
const UsuariosBD = require('./database/UsuariosBD')
const Email = require('./database/Email')

process.env.TZ = 'America/Sao_Paulo'

var senhaJornalista = process.env.SENHA_JORNALISTA

// A imagem de até 2 MiB do formulário chega em base64, junto com o texto da notícia.
const LIMITE_CORPO_POST = 4 * 1024 * 1024

var logados = []

function buscarSessao(req){
    var token = req.headers['authorization']

    for(var i = 0; i < logados.length; i++){
        if(logados[i].token == token){
            return logados[i]
        }
    }

    return null
}

function buscarUsuario(req){
    var token = req.headers['authorization']

    for(var i = 0; i < logados.length; i++){
        if(logados[i].token == token){
            return logados[i].usuario
        }
    }

    return null
}

function temPermissao(req){
    var sessao = buscarSessao(req)

    if(sessao == null || sessao.liberada == false){
        return false
    }

    if(sessao.usuario.tipo == 'jornalista' || sessao.usuario.tipo == 'admin'){
        return true
    }

    return false
}

function tipoDoArquivo(caminho){
    var extensao = caminho.split('.').pop().toLowerCase()

    switch(extensao){
        case 'html':
            return 'text/html; charset=utf-8'
        case 'css':
            return 'text/css; charset=utf-8'
        case 'js':
            return 'text/javascript; charset=utf-8'
        case 'png':
            return 'image/png'
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'gif':
            return 'image/gif'
        case 'webp':
            return 'image/webp'
        case 'svg':
            return 'image/svg+xml'
        case 'pdf':
            return 'application/pdf'
        default:
            return ''
    }
}

function entregarArquivo(pathname, res){
    if(pathname == '/'){
        res.writeHead(302, {'Location': '/html/index.html'})
        res.end()
        return
    }

    var caminho = './front' + pathname
    var tipo = tipoDoArquivo(caminho)

    if(pathname.includes('..') || pathname.includes('%') || tipo == ''){
        res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'})
        res.end('Página não encontrada')
        return
    }

    fs.readFile(caminho, (error, conteudo) => {
        if(error){
            res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'})
            res.end('Página não encontrada')
            return
        }

        res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': 'no-cache'})
        res.end(conteudo)
    })
}

function responder(res, status, dados){
    res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'})
    res.end(JSON.stringify(dados))
}

function responderResultado(res, resposta){
    if(resposta.error){
        responder(res, 400, resposta)
    }else{
        responder(res, 200, resposta)
    }
}

function lerCorpoPost(req, res, processar){
    const partes = []
    let tamanho = 0

    req.on('error', () => {
        partes.length = 0
        if(!res.destroyed && !res.writableEnded){
            responder(res, 400, {'error': 'Não foi possível ler o corpo da requisição.'})
        }
    })

    function rejeitarTamanho(){
        partes.length = 0
        res.setHeader('Connection', 'close')
        responder(res, 413, {'error': 'O corpo da requisição excede o limite de 4 MiB.'})
    }

    if(Number(req.headers['content-length']) > LIMITE_CORPO_POST){
        rejeitarTamanho()
        return
    }

    req.on('data', (parte) => {
        if(res.writableEnded){
            return
        }

        tamanho += parte.length
        if(tamanho > LIMITE_CORPO_POST){
            rejeitarTamanho()
            return
        }
        partes.push(parte)
    })

    req.on('end', () => {
        if(res.writableEnded){
            return
        }

        let dados = {}
        if(tamanho > 0){
            try{
                dados = JSON.parse(Buffer.concat(partes, tamanho).toString('utf8'))
            }catch{
                responder(res, 400, {'error': 'O corpo da requisição contém JSON inválido.'})
                return
            }
        }

        // Os formulários enviam apenas campos simples, com null para valores opcionais.
        if(dados === null || typeof dados !== 'object' || Array.isArray(dados) ||
            Object.values(dados).some(valor => valor !== null && typeof valor === 'object')){
            responder(res, 400, {'error': 'Envie um objeto JSON com campos simples.'})
            return
        }

        processar(dados)
    })
}

const callback = (req, res) => {
    var rota = url.parse(req.url, true)

    if(req.method == 'GET'){

        if(rota.pathname == '/noticias'){
            NoticiasBD.getNoticias(rota.query.categoria, rota.query.limite, (noticias) => {
                responder(res, 200, noticias)
            })
        }
        else if(rota.pathname == '/noticia'){
            NoticiasBD.getNoticia(rota.query.id, (noticia) => {
                responderResultado(res, noticia)
            })
        }
        else if(rota.pathname == '/categorias'){
            responder(res, 200, NoticiasBD.CATEGORIAS)
        }
        else if(rota.pathname == '/sessao'){
            var usuario = buscarUsuario(req)

            if(usuario == null){
                responder(res, 200, {'logado': false})
            }else{
                responder(res, 200, {'logado': true, 'nome': usuario.nome, 'tipo': usuario.tipo, 'liberada': buscarSessao(req).liberada})
            }
        }
        else if(rota.pathname == '/registros'){
            if(!temPermissao(req)){
                responder(res, 401, {'error': 'Só a imprensa vê o histórico.'})
            }
            else{
                UsuariosBD.getRegistros((lista) => {
                    responder(res, 200, lista)
                })
            }
        }
        else if(rota.pathname == '/usuarios'){
            var usuario = buscarUsuario(req)

            if(usuario == null || usuario.tipo != 'admin' || buscarSessao(req).liberada == false){
                responder(res, 401, {'error': 'Só a administração vê isso.'})
            }
            else{
                UsuariosBD.getUsuarios((lista) => {
                    responder(res, 200, lista)
                })
            }
        }
        else{
            entregarArquivo(rota.pathname, res)
        }
    }

    else if(req.method == 'POST'){
        lerCorpoPost(req, res, (dados) => {
            var usuario = buscarUsuario(req)

            if(rota.pathname == '/cadastro'){
                UsuariosBD.cadastrar(dados, (resposta) => {
                    if(resposta.codigo){
                        Email.enviarCodigo(resposta.nome, String(dados.email).trim().toLowerCase(), resposta.codigo)
                        delete resposta.codigo
                    }
                    responderResultado(res, resposta)
                })
            }
            else if(rota.pathname == '/reenviar'){
                var email = String(dados.email || '').trim().toLowerCase()

                UsuariosBD.novoCodigoPara(email, (resposta) => {
                    if(resposta.codigo){
                        Email.enviarCodigo('', email, resposta.codigo)
                        delete resposta.codigo
                    }
                    responderResultado(res, resposta)
                })
            }
            else if(rota.pathname == '/verificar'){
                var email = String(dados.email || '').trim().toLowerCase()

                UsuariosBD.verificar(email, String(dados.codigo || '').trim(), (resposta) => {
                    responderResultado(res, resposta)
                })
            }
            else if(rota.pathname == '/login'){
                var email = String(dados.email || '').trim().toLowerCase()

                UsuariosBD.entrar(email, String(dados.senha || ''), (resposta) => {
                    if(resposta.error){
                        responder(res, 401, resposta)
                        return
                    }

                    var token = crypto.randomBytes(32).toString('hex')
                    logados.push({'token': token, 'usuario': resposta, 'liberada': false})
                    responder(res, 200, {'message': 'Bem-vindo, ' + resposta.nome + '!', 'token': token, 'tipo': resposta.tipo})
                })
            }
            else if(rota.pathname == '/senha-imprensa'){
                var sessao = buscarSessao(req)

                if(sessao == null){
                    responder(res, 401, {'error': 'Entre com a sua conta primeiro.', 'sair': true})
                }
                else if(senhaJornalista == null || dados.senha != senhaJornalista){
                    responder(res, 401, {'error': 'Senha da imprensa incorreta.'})
                }
                else{
                    sessao.liberada = true
                    responder(res, 200, {'message': 'Área da imprensa liberada.'})
                }
            }
            else if(rota.pathname == '/logout'){
                var continuam = []
                for(var i = 0; i < logados.length; i++){
                    if(logados[i].token != req.headers['authorization']){
                        continuam.push(logados[i])
                    }
                }
                logados = continuam
                responder(res, 200, {'message': 'Até logo!'})
            }
            else if(rota.pathname.startsWith('/usuarios/')){
                if(usuario == null || usuario.tipo != 'admin' || buscarSessao(req).liberada == false){
                    responder(res, 401, {'error': 'Só a administração pode fazer isso.'})
                    return
                }

                if(dados.id == usuario.id){
                    responder(res, 400, {'error': 'Você não pode mudar a sua própria conta.'})
                    return
                }

                var tipo = ''
                switch(rota.pathname){
                    case '/usuarios/aprovar':
                        tipo = 'jornalista'
                        break
                    case '/usuarios/bloquear':
                        tipo = 'pendente'
                        break
                    case '/usuarios/admin':
                        tipo = 'admin'
                        break
                    case '/usuarios/tirar-admin':
                        tipo = 'jornalista'
                        break
                }

                UsuariosBD.mudarTipo(dados.id, tipo, (resposta) => {
                    if(!resposta.error){
                        for(var i = 0; i < logados.length; i++){
                            if(logados[i].usuario.id == dados.id){
                                logados[i].usuario.tipo = tipo
                            }
                        }
                    }
                    responderResultado(res, resposta)
                })
            }
            else if(!temPermissao(req)){
                responder(res, 401, {'error': 'Sua conta ainda não pode publicar. Entre com uma conta liberada.', 'sair': usuario == null})
            }
            else if(rota.pathname == '/noticias/criar'){
                NoticiasBD.addNoticia(dados, (resposta) => {
                    if(!resposta.error){
                        UsuariosBD.registrar(usuario, 'publicou', dados.titulo)
                    }
                    responderResultado(res, resposta)
                })
            }
            else if(rota.pathname == '/noticias/editar'){
                NoticiasBD.editarNoticia(dados, (resposta) => {
                    if(!resposta.error){
                        UsuariosBD.registrar(usuario, 'editou', dados.titulo)
                    }
                    responderResultado(res, resposta)
                })
            }
            else if(rota.pathname == '/noticias/excluir'){
                NoticiasBD.getNoticia(dados.id, (noticia) => {
                    NoticiasBD.excluir(dados.id, (resposta) => {
                        if(!resposta.error){
                            UsuariosBD.registrar(usuario, 'apagou', noticia.titulo)
                        }
                        responderResultado(res, resposta)
                    })
                })
            }
            else{
                responder(res, 404, {'error': 'Rota não encontrada'})
            }
        })
    }
}

var porta = process.env.PORT
if(porta == null){
    porta = 3000
}

const server = http.createServer(callback)
server.listen(porta, () => { console.log('Servidor rodando em http://localhost:' + porta) })
