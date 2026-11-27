var fotoNova = null
var editandoId = null

var emailEsperando = ''

verificarLogin()

function verificarLogin(){
    buscar('/sessao', function(dados){
        document.getElementById('telaLogin').hidden = true
        document.getElementById('telaEspera').hidden = true
        document.getElementById('telaSenha').hidden = true
        document.getElementById('telaPainel').hidden = true

        if(dados.logado == false){
            document.getElementById('telaLogin').hidden = false
            document.getElementById('textoLogin').textContent = 'Login'
        }
        else if(dados.tipo == 'pendente'){
            document.getElementById('telaEspera').hidden = false
        }
        else if(dados.liberada == false){
            document.getElementById('nomeSenha').textContent = dados.nome
            document.getElementById('telaSenha').hidden = false
        }
        else{
            mostrarPainel(dados)
        }
    })
}

function mostrarPainel(dados){
    document.getElementById('telaPainel').hidden = false
    document.getElementById('nomeConectado').textContent = dados.nome
    document.getElementById('autor').value = dados.nome
    document.getElementById('textoLogin').textContent = 'Imprensa'
    carregarCategorias()
    carregarPublicadas()

    carregarRegistros()

    if(dados.tipo == 'admin'){
        document.getElementById('blocoContas').hidden = false
        carregarUsuarios()
    }
}

function mostrarAba(aba){
    document.getElementById('formEntrar').hidden = true
    document.getElementById('formCriar').hidden = true
    document.getElementById('formCodigo').hidden = true
    document.getElementById('abaEntrar').classList.remove('ativo')
    document.getElementById('abaCriar').classList.remove('ativo')
    document.getElementById('msgLogin').className = 'msg'

    switch(aba){
        case 'entrar':
            document.getElementById('formEntrar').hidden = false
            document.getElementById('abaEntrar').classList.add('ativo')
            break
        case 'criar':
            document.getElementById('formCriar').hidden = false
            document.getElementById('abaCriar').classList.add('ativo')
            break
        case 'codigo':
            document.getElementById('formCodigo').hidden = false
            document.getElementById('emailCodigo').textContent = emailEsperando
            break
    }
}

function criarConta(){
    var conta = {
        nome: document.getElementById('cadNome').value,
        email: document.getElementById('cadEmail').value,
        senha: document.getElementById('cadSenha').value
    }

    enviar('/cadastro', conta, function(dados){
        if(dados.error){
            mostrarMensagem('msgLogin', dados.error, 'erro')
            return
        }

        emailEsperando = conta.email.trim().toLowerCase()
        document.getElementById('cadSenha').value = ''
        mostrarAba('codigo')
        mostrarMensagem('msgLogin', dados.message, 'ok')
    })
}

function confirmarCodigo(){
    var codigo = document.getElementById('codigo').value

    enviar('/verificar', {email: emailEsperando, codigo: codigo}, function(dados){
        if(dados.error){
            mostrarMensagem('msgLogin', dados.error, 'erro')
            return
        }

        document.getElementById('codigo').value = ''
        document.getElementById('loginEmail').value = emailEsperando
        mostrarAba('entrar')
        mostrarMensagem('msgLogin', dados.message, 'ok')
    })
}

function reenviarCodigo(){
    enviar('/reenviar', {email: emailEsperando}, function(dados){
        if(dados.error){
            mostrarMensagem('msgLogin', dados.error, 'erro')
        }else{
            mostrarMensagem('msgLogin', dados.message, 'ok')
        }
    })
}

function entrar(){
    var email = document.getElementById('loginEmail').value
    var senha = document.getElementById('loginSenha').value

    enviar('/login', {email: email, senha: senha}, function(dados){
        document.getElementById('loginSenha').value = ''

        if(dados.error){
            if(dados.verificar){
                emailEsperando = email.trim().toLowerCase()
                reenviarCodigo()
                mostrarAba('codigo')
            }
            mostrarMensagem('msgLogin', dados.error, 'erro')
            return
        }

        localStorage.setItem(CHAVE_TOKEN, dados.token)
        document.getElementById('msgLogin').className = 'msg'
        verificarLogin()
    })
}

function liberarImprensa(){
    var senha = document.getElementById('senhaImprensa').value

    enviar('/senha-imprensa', {senha: senha}, function(dados){
        document.getElementById('senhaImprensa').value = ''

        if(dados.error){
            mostrarMensagem('msgSenha', dados.error, 'erro')

            if(dados.sair){
                localStorage.removeItem(CHAVE_TOKEN)
                verificarLogin()
            }
            return
        }

        document.getElementById('msgSenha').className = 'msg'
        verificarLogin()
    })
}

function sair(){
    enviar('/logout', {}, function(){
        localStorage.removeItem(CHAVE_TOKEN)
        mostrarAba('entrar')
        verificarLogin()
    })
}

function carregarUsuarios(){
    buscar('/usuarios', function(usuarios){
        var html = ''

        for(var i = 0; i < usuarios.length; i++){
            var u = usuarios[i]
            var situacao = ''
            var botao = ''

            switch(u.tipo){
                case 'admin':
                    situacao = 'Administração'
                    botao = `<button class="botao botao-linha" onclick="mudarConta(${u.id}, 'tirar-admin')">Tirar administração</button>`
                    break
                case 'jornalista':
                    situacao = 'Liberada'
                    botao = `<button class="botao botao-linha" onclick="mudarConta(${u.id}, 'admin')">Tornar administrador</button> <button class="botao botao-apagar" onclick="mudarConta(${u.id}, 'bloquear')">Bloquear</button>`
                    break
                default:
                    situacao = 'Esperando aprovação'
                    botao = `<button class="botao botao-azul" onclick="mudarConta(${u.id}, 'aprovar')">Liberar</button>`
            }

            if(u.verificado == 0){
                situacao = 'E-mail não confirmado'
                botao = ''
            }

            html += `<tr><td>${seguro(u.nome)}</td><td>${seguro(u.email)}</td><td>${situacao}</td><td>${botao}</td></tr>`
        }

        document.getElementById('listaUsuarios').innerHTML = html
    })
}

function mudarConta(id, acao){
    if(acao == 'admin' && !confirm('Esta pessoa vai poder liberar, bloquear e mudar outras contas. Continuar?')){
        return
    }

    enviar('/usuarios/' + acao, {id: id}, function(dados){
        if(dados.error){
            alert(dados.error)
        }
        carregarUsuarios()
    })
}

function carregarRegistros(){
    buscar('/registros', function(registros){
        var html = ''

        for(var i = 0; i < registros.length; i++){
            var r = registros[i]
            html += `<tr><td>${formatarData(r.quando)}</td><td>${seguro(r.usuario)}<small>${seguro(r.email)}</small></td><td>${seguro(r.acao)} <b>${seguro(r.noticia)}</b></td></tr>`
        }

        if(registros.length == 0){
            html = '<tr><td colspan="3">Nada registrado ainda.</td></tr>'
        }

        document.getElementById('listaRegistros').innerHTML = html
    })
}

function carregarCategorias(){
    buscar('/categorias', function(categorias){
        var html = '<option value="">Escolha...</option>'

        for(var i = 0; i < categorias.length; i++){
            html += `<option>${categorias[i]}</option>`
        }

        document.getElementById('categoria').innerHTML = html
    })
}

function carregarPublicadas(){
    buscar('/noticias', function(noticias){
        var html = ''

        for(var i = 0; i < noticias.length; i++){
            var n = noticias[i]
            var manchete = ''
            var foto = '<span class="pub-foto"></span>'

            if(n.destaque){
                manchete = '<span class="pub-manchete">Manchete</span>'
            }

            if(n.imagem){
                foto = '<img class="pub-foto" src="' + n.imagem + '" alt="">'
            }

            html += `
                <li>
                    ${foto}
                    <div class="pub-texto">
                        ${manchete}
                        <a href="noticia.html?id=${n.id}" target="_blank">${seguro(n.titulo)}</a>
                        <small>${seguro(n.categoria)}, ${dataCurta(n.criado_em)}</small>
                        <span class="acoes">
                            <button onclick="editar(${n.id})">Editar</button>
                            <button class="apagar" onclick="apagar(${n.id})">Apagar</button>
                        </span>
                    </div>
                </li>`
        }

        if(noticias.length == 0){
            html = '<li>Nenhuma notícia ainda.</li>'
        }

        document.getElementById('listaPublicadas').innerHTML = html
    })
}

function escolheuFoto(){
    var arquivo = document.getElementById('imagem').files[0]
    fotoNova = null

    if(arquivo == null){
        return
    }

    if(arquivo.size > 2 * 1024 * 1024){
        alert('A foto passa de 2 MB. Escolha uma menor.')
        document.getElementById('imagem').value = ''
        return
    }

    var leitor = new FileReader()

    leitor.onload = function(){
        fotoNova = leitor.result
        document.getElementById('previa').src = fotoNova
        document.getElementById('previa').style.display = 'block'
    }

    leitor.readAsDataURL(arquivo)
}

function publicar(){
    var noticia = {
        id: editandoId,
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        autor: document.getElementById('autor').value,
        resumo: document.getElementById('resumo').value,
        conteudo: document.getElementById('conteudo').value,
        destaque: document.getElementById('destaque').checked,
        imagem: fotoNova,
        removerImagem: document.getElementById('removerImagem').checked
    }

    var rota = '/noticias/criar'
    if(editandoId != null){
        rota = '/noticias/editar'
    }

    enviar(rota, noticia, function(dados){
        if(dados.error){
            mostrarMensagem('msgPublicar', dados.error, 'erro')

            if(dados.sair){
                localStorage.removeItem(CHAVE_TOKEN)
                verificarLogin()
            }
            return
        }

        limparFormulario()
        mostrarMensagem('msgPublicar', dados.message, 'ok')
        document.getElementById('msgPublicar').innerHTML += ` <a href="noticia.html?id=${dados.id}" target="_blank">Ver como ficou</a>`
        window.scrollTo(0, 0)
        carregarPublicadas()
        carregarRegistros()
    })
}

function editar(id){
    buscar('/noticia?id=' + id, function(n){
        limparFormulario()
        editandoId = n.id

        document.getElementById('titulo').value = n.titulo
        document.getElementById('categoria').value = n.categoria
        document.getElementById('autor').value = n.autor
        document.getElementById('resumo').value = n.resumo
        document.getElementById('conteudo').value = n.conteudo
        document.getElementById('destaque').checked = n.destaque == 1

        if(n.imagem){
            document.getElementById('previa').src = n.imagem
            document.getElementById('previa').style.display = 'block'
            document.getElementById('campoRemover').hidden = false
        }

        document.getElementById('tituloForm').textContent = 'Editar notícia'
        document.getElementById('botaoPublicar').textContent = 'Salvar alterações'
        document.getElementById('botaoCancelar').hidden = false
        document.getElementById('msgPublicar').className = 'msg'
        window.scrollTo(0, 0)
    })
}

function limparFormulario(){
    editandoId = null
    fotoNova = null

    var campos = ['titulo', 'categoria', 'resumo', 'conteudo', 'imagem']
    for(var i = 0; i < campos.length; i++){
        document.getElementById(campos[i]).value = ''
    }

    document.getElementById('destaque').checked = false
    document.getElementById('removerImagem').checked = false
    document.getElementById('campoRemover').hidden = true
    document.getElementById('previa').style.display = 'none'
    document.getElementById('tituloForm').textContent = 'Escrever notícia'
    document.getElementById('botaoPublicar').textContent = 'Publicar'
    document.getElementById('botaoCancelar').hidden = true
}

function apagar(id){
    if(!confirm('Tem certeza que quer apagar esta notícia?')){
        return
    }

    enviar('/noticias/excluir', {id: id}, function(dados){
        if(dados.error){
            alert(dados.error)
            return
        }

        if(id == editandoId){
            limparFormulario()
        }

        carregarPublicadas()
        carregarRegistros()
    })
}


function mostrarMensagem(id, texto, tipo){
    var caixa = document.getElementById(id)
    caixa.textContent = texto
    caixa.className = 'msg ' + tipo
}
