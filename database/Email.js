const nodemailer = require('nodemailer')

class Email{

    static transportador(){
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USUARIO,
                pass: process.env.EMAIL_SENHA
            }
        })
    }

    static enviarCodigo(nome, email, codigo){
        if(process.env.EMAIL_USUARIO == null || process.env.EMAIL_SENHA == null){
            console.log('Código de ' + email + ': ' + codigo)
            return
        }

        var saudacao = 'Olá.'
        if(nome){
            saudacao = 'Olá, ' + nome + '.'
        }

        var html = `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #18212e">
                <h2 style="color: #1a2b44">Simulação Senac</h2>
                <p>${saudacao}</p>
                <p>Seu código para confirmar o cadastro na imprensa da simulação é:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2f6db3">${codigo}</p>
                <p style="color: #64707f; font-size: 13px">Se você não pediu este cadastro, ignore este e-mail.</p>
            </div>`

        var mensagem = {
            from: 'Simulação Senac <' + process.env.EMAIL_USUARIO + '>',
            to: email,
            subject: 'Seu código: ' + codigo,
            html: html
        }

        Email.transportador().sendMail(mensagem, (error) => {
            if(error){
                console.log('Não deu para enviar o e-mail para ' + email + ': ' + error.message)
            }
        })
    }
}

module.exports = Email
