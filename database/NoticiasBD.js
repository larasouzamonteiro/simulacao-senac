const mysql = require('mysql2')

class NoticiasBD{

    static connect(){
        var dados = {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORTA),
            user: process.env.DB_USUARIO,
            password: process.env.DB_SENHA,
            database: process.env.DB_NOME,
            ssl: {}
        }

        if(process.env.DB_SSL == 'nao'){
            dados.ssl = null
        }

        const connection = mysql.createConnection(dados)
        connection.connect((error) => {
            if(error){
                console.log('Não deu para entrar no banco: ' + error.message)
            }
        })
        connection.on('error', (error) => {
            console.log('Erro no banco: ' + error.message)
        })
        return connection
    }

    static doisDigitos(numero){
        if(numero < 10){
            return '0' + numero
        }
        return '' + numero
    }

    static agora(){
        var d = new Date()
        var mes = NoticiasBD.doisDigitos(d.getMonth() + 1)
        var dia = NoticiasBD.doisDigitos(d.getDate())
        var hora = NoticiasBD.doisDigitos(d.getHours())
        var minuto = NoticiasBD.doisDigitos(d.getMinutes())
        return d.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minuto
    }

    static getNoticias(categoria, limite, callback){
        const connection = NoticiasBD.connect()
        var sql = 'select * from noticias'
        var valores = []

        if(categoria){
            sql += ' where categoria = ?'
            valores.push(categoria)
        }

        sql += ' order by criado_em desc'

        if(limite){
            sql += ' limit ?'
            valores.push(Number(limite))
        }

        connection.query(sql, valores, (error, results) => {
            if(error){
                console.log(error.message)
                return callback([])
            }
            callback(results)
        })
        connection.end()
    }

    static getNoticia(id, callback){
        const connection = NoticiasBD.connect()

        connection.query('select * from noticias where id = ?', id, (error, results) => {
            if(error || results.length == 0){
                return callback({'error': 'Notícia não encontrada.'})
            }
            callback(results[0])
        })
        connection.end()
    }

    static conferir(noticia){
        if(!noticia.titulo || !noticia.conteudo){
            return 'Escreva o título e o texto da notícia.'
        }

        if(!NoticiasBD.CATEGORIAS.includes(noticia.categoria)){
            return 'Escolha uma categoria.'
        }

        if(noticia.imagem && (typeof noticia.imagem !== 'string' || !noticia.imagem.startsWith('data:image/'))){
            return 'A foto precisa ser uma imagem.'
        }

        return ''
    }

    static addNoticia(noticia, callback){
        var erro = NoticiasBD.conferir(noticia)
        if(erro != ''){
            return callback({'error': erro})
        }

        var autor = noticia.autor
        if(!autor){
            autor = 'Imprensa'
        }

        var destaque = 0
        if(noticia.destaque){
            destaque = 1
        }

        var nova = {
            titulo: noticia.titulo,
            resumo: noticia.resumo,
            conteudo: noticia.conteudo,
            categoria: noticia.categoria,
            autor: autor,
            imagem: noticia.imagem,
            destaque: destaque,
            criado_em: NoticiasBD.agora()
        }

        const connection = NoticiasBD.connect()

        if(destaque == 1){
            connection.query('update noticias set destaque = 0', () => {})
        }

        connection.query('insert into noticias set ?', nova, (error, results) => {
            if(error){
                console.log(error.message)
                return callback({'error': 'Não deu para salvar a notícia.'})
            }
            callback({'message': 'Notícia publicada.', 'id': results.insertId})
        })
        connection.end()
    }

    static editarNoticia(noticia, callback){
        var erro = NoticiasBD.conferir(noticia)
        if(erro != ''){
            return callback({'error': erro})
        }

        var autor = noticia.autor
        if(!autor){
            autor = 'Imprensa'
        }

        var destaque = 0
        if(noticia.destaque){
            destaque = 1
        }

        var mudancas = {
            titulo: noticia.titulo,
            resumo: noticia.resumo,
            conteudo: noticia.conteudo,
            categoria: noticia.categoria,
            autor: autor,
            destaque: destaque,
            editado_em: NoticiasBD.agora()
        }

        if(noticia.imagem){
            mudancas.imagem = noticia.imagem
        }else if(noticia.removerImagem){
            mudancas.imagem = null
        }

        const connection = NoticiasBD.connect()

        if(destaque == 1){
            connection.query('update noticias set destaque = 0', () => {})
        }

        connection.query('update noticias set ? where id = ?', [mudancas, noticia.id], (error, results) => {
            if(error){
                console.log(error.message)
                return callback({'error': 'Não deu para salvar as alterações.'})
            }
            if(results.affectedRows == 0){
                return callback({'error': 'Notícia não encontrada.'})
            }
            callback({'message': 'Alterações salvas.', 'id': noticia.id})
        })
        connection.end()
    }

    static excluir(id, callback){
        const connection = NoticiasBD.connect()

        connection.query('delete from noticias where id = ?', id, (error, results) => {
            if(error){
                console.log(error.message)
                return callback({'error': 'Não deu para apagar a notícia.'})
            }
            if(results.affectedRows == 0){
                return callback({'error': 'Notícia não encontrada.'})
            }
            callback({'message': 'Notícia apagada.'})
        })
        connection.end()
    }
}

NoticiasBD.CATEGORIAS = ['Plenário', 'Delegações', 'Conselho de Segurança', 'Direitos Humanos', 'Bastidores', 'Entrevistas']

module.exports = NoticiasBD
