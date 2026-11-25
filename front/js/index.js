var DELEGACOES = [
    {nome: 'África do Sul', arquivo: 'africa-do-sul'},
    {nome: 'Austrália', arquivo: 'australia'},
    {nome: 'Brasil', arquivo: 'brasil'},
    {nome: 'Canadá', arquivo: 'canada'},
    {nome: 'China', arquivo: 'china'},
    {nome: 'Egito', arquivo: 'egito'},
    {nome: 'Estados Unidos', arquivo: 'estados-unidos'},
    {nome: 'França', arquivo: 'franca'},
    {nome: 'Índia', arquivo: 'india'},
    {nome: 'Iraque', arquivo: 'iraque'},
    {nome: 'México', arquivo: 'mexico'},
    {nome: 'Reino Unido', arquivo: 'reino-unido'},
    {nome: 'RSS da Ucrânia', arquivo: 'ucrania'},
    {nome: 'Síria', arquivo: 'siria'},
    {nome: 'União Soviética', arquivo: 'uniao-sovietica'}
]

mostrarBandeiras()
carregarUltimas()

function mostrarBandeiras(){
    var html = ''

    for(var i = 0; i < DELEGACOES.length; i++){
        var d = DELEGACOES[i]

        html += `
            <button class="bandeira" onclick="abrirGuia(${i})">
                <img src="../img/bandeiras/${d.arquivo}.svg" alt="Bandeira - ${d.nome}">
                <span>${d.nome}</span>
                <small>Ver PDF</small>
            </button>`
    }

    document.getElementById('bandeiras').innerHTML = html
}

function abrirGuia(numero){
    var d = DELEGACOES[numero]
    var pdf = '../pdfs/' + d.arquivo + '.pdf'

    document.getElementById('modal-titulo').textContent = d.nome
    document.getElementById('modal-bandeira').src = '../img/bandeiras/' + d.arquivo + '.svg'
    document.getElementById('modal-abrir').href = pdf
    document.getElementById('modal-baixar').href = pdf
    document.getElementById('modal-corpo').innerHTML = `<iframe src="${pdf}" title="Guia - ${d.nome}"></iframe>`

    document.getElementById('modal-guia').classList.add('aberto')
}

function fecharGuia(){
    document.getElementById('modal-guia').classList.remove('aberto')
    document.getElementById('modal-corpo').innerHTML = ''
}

document.addEventListener('keydown', function(evento){
    if(evento.key == 'Escape'){
        fecharGuia()
    }
})

function carregarUltimas(){
    buscar('/noticias?limite=3', function(noticias){
        var html = ''

        for(var i = 0; i < noticias.length; i++){
            html += htmlCartao(noticias[i])
        }

        if(noticias.length == 0){
            html = '<p class="aviso">Ainda não tem notícia publicada.</p>'
        }

        document.getElementById('home-noticias').innerHTML = html
    })
}
