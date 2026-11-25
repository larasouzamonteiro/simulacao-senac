carregarNoticia()

function carregarNoticia(){
    buscar('/noticia?id=' + parametro('id'), function(n){

        if(n.error){
            document.getElementById('carregando').innerHTML = '<p class="aviso">' + seguro(n.error) + '</p>'
            return
        }

        document.title = n.titulo + ' - Simulação Senac'

        var partes = n.conteudo.split('\n\n')
        var texto = ''

        for(var i = 0; i < partes.length; i++){
            var classe = ''
            if(i == 0){
                classe = ' class="abertura"'
            }
            texto += '<p' + classe + '>' + seguro(partes[i]).replaceAll('\n', '<br>') + '</p>'
        }

        var linhaFina = ''
        if(n.resumo){
            linhaFina = `<p class="linha-fina">${seguro(n.resumo)}</p>`
        }

        var foto = ''
        var classeCapa = 'materia-capa sem-foto'
        var verFoto = ''
        if(n.imagem){
            foto = `<img class="capa-foto" src="${seguro(n.imagem)}" alt="">`
            classeCapa = 'materia-capa'
            verFoto = `<button class="ver-foto" onclick="abrirFoto()">Ver foto inteira</button>`
            document.getElementById('foto-inteira').src = n.imagem
        }

        document.getElementById('materia').innerHTML = `
            <header class="${classeCapa}">
                ${foto}
                <a href="noticias.html" class="botao-voltar" title="Voltar para as notícias"><span class="icone icone-voltar"></span>Voltar</a>
                ${verFoto}
                <div class="capa-conteudo">
                    <a href="noticias.html" class="voltar">Notícias</a>
                    <span class="cat">${seguro(n.categoria)}</span>
                    <h1>${seguro(n.titulo)}</h1>
                    ${linhaFina}
                </div>
            </header>
            <div class="materia-corpo">
                <aside class="materia-lado">
                    <div><small>Por</small><b>${seguro(n.autor)}</b></div>
                    <div><small>Publicada em</small><b>${formatarData(n.criado_em)}</b></div>
                    <div><small>Leitura</small><b>${tempoDeLeitura(n.conteudo)}</b></div>
                    <div class="compartilhar">
                        <small>Compartilhar</small>
                        <button onclick="copiarLink(this)">Copiar link</button>
                        <a href="https://wa.me/?text=${encodeURIComponent(n.titulo + ' ' + window.location.href)}" target="_blank" rel="noopener">WhatsApp</a>
                    </div>
                </aside>
                <div class="texto">${texto}</div>
            </div>`

        carregarMais(n.id)
    })
}

function tempoDeLeitura(conteudo){
    var palavras = conteudo.split(/\s+/).length
    var minutos = Math.ceil(palavras / 200)

    if(minutos <= 1){
        return '1 minuto'
    }
    return minutos + ' minutos'
}

function copiarLink(botao){
    navigator.clipboard.writeText(window.location.href)
    botao.textContent = 'Link copiado'
}

function carregarMais(idAtual){
    buscar('/noticias', function(noticias){
        var html = ''
        var quantas = 0

        for(var i = 0; i < noticias.length && quantas < 3; i++){
            if(noticias[i].id != idAtual){
                html += htmlCartao(noticias[i])
                quantas = quantas + 1
            }
        }

        if(quantas > 0){
            document.getElementById('lista-mais').innerHTML = html
            document.getElementById('mais').hidden = false
        }
    })
}

function abrirFoto(){
    document.getElementById('janela-foto').classList.add('aberto')
}

function fecharFoto(){
    document.getElementById('janela-foto').classList.remove('aberto')
}

document.addEventListener('keydown', function(evento){
    if(evento.key == 'Escape'){
        fecharFoto()
    }
})
