const crypto = require('crypto')
const NoticiasBD = require('./NoticiasBD')

class UsuariosBD{

    static guardarSenha(senha){
        var sal = crypto.randomBytes(16).toString('hex')
        var hash = crypto.scryptSync(senha, sal, 64).toString('hex')
        return sal + ':' + hash
    }

    static senhaCerta(senha, guardada){
        var partes = guardada.split(':')
        var hash = crypto.scryptSync(senha, partes[0], 64).toString('hex')

        if(hash == partes[1]){
            return true
        }
        return false
    }

    static novoCodigo(){
        return String(crypto.randomInt(100000, 1000000))
    }

    static emailDaEscola(email){
        var dominio = email.split('@')[1]

        switch(dominio){
            case 'alunos.sc.senac.br':
            case 'sc.senac.br':
            case 'prof.sc.senac.br':
                return true
            default:
                return false
        }
    }

    static tipoInicial(email){
        var admin = 'lara.monteiro@alunos.sc.senac.br' //para botar outro admin é colocando na variavel de ambiente admin 
        if(process.env.ADMIN_EMAIL){
            admin = process.env.ADMIN_EMAIL.toLowerCase()
        }

        if(email == admin){
            return 'admin'
        }

        if(UsuariosBD.emailDaEscola(email)){
            return 'jornalista'
        }

        return 'pendente'
    }

    static cadastrar(dados, callback){
        var nome = String(dados.nome || '').trim()
        var email = String(dados.email || '').trim().toLowerCase()
        var senha = String(dados.senha || '')

        if(nome == '' || !email.includes('@')){
            return callback({'error': 'Escreva seu nome e um e-mail válido.'})
        }

        if(senha.length < 6){
            return callback({'error': 'A senha precisa ter pelo menos 6 caracteres.'})
        }

        var codigo = UsuariosBD.novoCodigo()

        var novo = {
            nome: nome,
            email: email,
            senha: UsuariosBD.guardarSenha(senha),
            tipo: UsuariosBD.tipoInicial(email),
            codigo: codigo,
            criado_em: NoticiasBD.agora()
        }

        const connection = NoticiasBD.connect()

        connection.query('insert into usuarios set ?', novo, (error) => {
            if(error){
                if(error.code == 'ER_DUP_ENTRY'){
                    return callback({'error': 'Este e-mail já tem cadastro. Entre com ele.'})
                }
                console.log(error.message)
                return callback({'error': 'Não deu para criar a conta.'})
            }
            callback({'message': 'Conta criada. Enviamos um código para o seu e-mail.', 'codigo': codigo, 'nome': nome})
        })
        connection.end()
    }

    static novoCodigoPara(email, callback){
        var codigo = UsuariosBD.novoCodigo()
        const connection = NoticiasBD.connect()

        connection.query('update usuarios set codigo = ? where email = ? and verificado = 0', [codigo, email], (error, results) => {
            if(error || results.affectedRows == 0){
                return callback({'error': 'Não encontramos uma conta esperando verificação com este e-mail.'})
            }
            callback({'message': 'Enviamos um código novo.', 'codigo': codigo})
        })
        connection.end()
    }

    static verificar(email, codigo, callback){
        const connection = NoticiasBD.connect()

        connection.query('update usuarios set verificado = 1, codigo = null where email = ? and codigo = ?', [email, codigo], (error, results) => {
            if(error || results.affectedRows == 0){
                return callback({'error': 'Código errado. Confira o e-mail e tente de novo.'})
            }
            callback({'message': 'E-mail confirmado. Agora é só entrar.'})
        })
        connection.end()
    }

    static entrar(email, senha, callback){
        const connection = NoticiasBD.connect()

        connection.query('select * from usuarios where email = ?', email, (error, results) => {
            if(error || results.length == 0){
                return callback({'error': 'E-mail ou senha incorretos.'})
            }

            var usuario = results[0]

            if(!UsuariosBD.senhaCerta(senha, usuario.senha)){
                return callback({'error': 'E-mail ou senha incorretos.'})
            }

            if(usuario.verificado == 0){
                return callback({'error': 'Confirme seu e-mail antes de entrar.', 'verificar': true})
            }

            callback({'id': usuario.id, 'nome': usuario.nome, 'email': usuario.email, 'tipo': usuario.tipo})
        })
        connection.end()
    }

    static getUsuarios(callback){
        const connection = NoticiasBD.connect()

        connection.query('select id, nome, email, tipo, verificado, criado_em from usuarios order by tipo desc, criado_em desc', (error, results) => {
            if(error){
                console.log(error.message)
                return callback([])
            }
            callback(results)
        })
        connection.end()
    }

    static mudarTipo(id, tipo, callback){
        if(tipo != 'jornalista' && tipo != 'pendente' && tipo != 'admin'){
            return callback({'error': 'Tipo inválido.'})
        }

        const connection = NoticiasBD.connect()

        connection.query('update usuarios set tipo = ? where id = ?', [tipo, id], (error, results) => {
            if(error || results.affectedRows == 0){
                return callback({'error': 'Não deu para mudar este usuário.'})
            }
            callback({'message': 'Pronto.'})
        })
        connection.end()
    }

    static registrar(usuario, acao, noticia){
        var registro = {
            usuario: usuario.nome,
            email: usuario.email,
            acao: acao,
            noticia: noticia,
            quando: NoticiasBD.agora()
        }

        const connection = NoticiasBD.connect()
        connection.query('insert into registros set ?', registro, (error) => {
            if(error){
                console.log(error.message)
            }
        })
        connection.end()
    }

    static getRegistros(callback){
        const connection = NoticiasBD.connect()

        connection.query('select * from registros order by id desc limit 100', (error, results) => {
            if(error){
                console.log(error.message)
                return callback([])
            }
            callback(results)
        })
        connection.end()
    }
}

module.exports = UsuariosBD
