var SERVIDOR = new URL('..', document.currentScript.src).pathname.replace(/\/$/, '')
var CHAVE_TOKEN = SERVIDOR ? SERVIDOR + ':token' : 'token'
var CHAVE_TEMA = SERVIDOR ? SERVIDOR + ':temaSite' : 'temaSite'

function buscar(rota, depois){
    fetch(SERVIDOR + rota, {
        method: 'GET',
        cache: 'no-store',
        headers: {
            'Authorization': meuToken()
        }
    })
    .then(function(response){
        return response.json()
    })
    .then(function(dados){
        depois(dados)
    })
    .catch(function(erro){
        console.log(erro)
    })
}

function enviar(rota, corpo, depois){
    fetch(SERVIDOR + rota, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': meuToken()
        },
        body: JSON.stringify(corpo)
    })
    .then(function(response){
        return response.json()
    })
    .then(function(dados){
        depois(dados)
    })
    .catch(function(erro){
        console.log(erro)
        depois({'error': 'Não deu para falar com o servidor.'})
    })
}

function meuToken(){
    var token = localStorage.getItem(CHAVE_TOKEN)

    if(token == null){
        token = ''
    }

    return token
}

function abrirMenu(){
    document.querySelector('.menu').classList.toggle('aberto')
}

function encolherMenu(){
    document.body.classList.toggle('menu-fechado')
}


function alternarTema(){
    var claro = document.body.classList.toggle('modo-claro')

    if(claro){
        localStorage.setItem(CHAVE_TEMA, 'claro')
    }else{
        localStorage.setItem(CHAVE_TEMA, 'escuro')
    }
    atualizarBotaoTema()
}

function atualizarBotaoTema(){
    var botao = document.getElementById('botaoTema')
    if(botao == null){
        return
    }

    if(document.body.classList.contains('modo-claro')){
        botao.setAttribute('title', 'Modo escuro')
    }else{
        botao.setAttribute('title', 'Modo claro')
    }
}

if(localStorage.getItem(CHAVE_TEMA) == 'claro'){
    document.body.classList.add('modo-claro')
}

atualizarBotaoTema()

buscar('/sessao', function(dados){
    if(dados.logado){
        document.getElementById('textoLogin').textContent = 'Imprensa'
    }
})

function seguro(texto){
    if(texto == null){
        texto = ''
    }

    var resultado = String(texto)
    resultado = resultado.replaceAll('&', '&amp;')
    resultado = resultado.replaceAll('<', '&lt;')
    resultado = resultado.replaceAll('>', '&gt;')
    resultado = resultado.replaceAll('"', '&quot;')
    return resultado
}

function formatarData(data){
    if(data == null){
        return ''
    }

    var partes = data.split(' ')
    var dia = partes[0].split('-')
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

    return Number(dia[2]) + ' de ' + meses[Number(dia[1]) - 1] + ' de ' + dia[0] + ', às ' + partes[1]
}

function diaEMes(data){
    var dia = data.split(' ')[0].split('-')
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

    return Number(dia[2]) + ' de ' + meses[Number(dia[1]) - 1]
}

function dataCurta(data){
    var completa = formatarData(data)
    return completa.split(',')[0]
}

function parametro(nome){
    return new URLSearchParams(window.location.search).get(nome)
}

function apertouEnter(evento, funcao){
    if(evento.key == 'Enter'){
        funcao()
    }
}

function htmlCartao(n){
    var foto = ''
    if(n.imagem){
        foto = `<img src="${seguro(n.imagem)}" alt="">`
    }

    return `
        <a class="noticia-card" href="noticia.html?id=${n.id}">
            <div class="foto">${foto}</div>
            <span class="cat">${seguro(n.categoria)}</span>
            <h3>${seguro(n.titulo)}</h3>
            <p>${seguro(n.resumo)}</p>
            <span class="data">${dataCurta(n.criado_em)}, por ${seguro(n.autor)}</span>
        </a>`
}
