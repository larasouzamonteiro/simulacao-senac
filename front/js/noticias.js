var todasNoticias = []
var diaEscolhido = ''

carregarCategorias()
carregarNoticias('', true)

if(parametro('busca')){
    document.getElementById('busca').value = parametro('busca')
}

function carregarCategorias(){
    buscar('/categorias', function(categorias){
        var html = ''

        for(var i = 0; i < categorias.length; i++){
            html += `<button onclick="filtrar(this, '${categorias[i]}')">${categorias[i]}</button>`
        }

        document.getElementById('filtros').innerHTML += html
    })
}

function filtrar(botao, categoria){
    var botoes = document.querySelectorAll('#filtros button')

    for(var i = 0; i < botoes.length; i++){
        botoes[i].classList.remove('ativo')
    }

    botao.classList.add('ativo')
    carregarNoticias(categoria, false)
}

function carregarNoticias(categoria, montarCapa){
    buscar('/noticias?categoria=' + encodeURIComponent(categoria), function(noticias){
        todasNoticias = noticias
        mostrarDias(noticias)
        mostrarDataDaCobertura(noticias)
        var html = porDia(doDia(noticias))

        if(noticias.length == 0){
            html = '<p class="aviso">Nenhuma notícia nessa categoria por enquanto.</p>'
        }

        document.getElementById('grade-noticias').innerHTML = html

        if(montarCapa && noticias.length > 0){
            mostrarCapa(noticias)
        }

        buscarNoticia()
    })
}

function mostrarCapa(noticias){
    var n = noticias[0]

    for(var i = 0; i < noticias.length; i++){
        if(noticias[i].destaque == 1){
            n = noticias[i]
            break
        }
    }

    var manchete = document.getElementById('manchete')
    var foto = ''

    if(n.imagem){
        foto = `<div class="foto"><img src="${seguro(n.imagem)}" alt=""></div>`
    }

    manchete.href = 'noticia.html?id=' + n.id
    manchete.innerHTML = `
        ${foto}
        <span class="cat">${seguro(n.categoria)}</span>
        <h2>${seguro(n.titulo)}</h2>
        <p>${seguro(n.resumo)}</p>
        <div class="manchete-pe">
            <span class="data">${dataCurta(n.criado_em)}, por ${seguro(n.autor)}</span>
            <span class="ler-mais">Ler mais</span>
        </div>`

    var html = ''
    var quantas = 0

    for(var i = 0; i < noticias.length && quantas < 3; i++){
        var d = noticias[i]
        var fotinha = ''

        if(d.id == n.id){
            continue
        }
        quantas = quantas + 1

        if(d.imagem){
            fotinha = `<img src="${seguro(d.imagem)}" alt="">`
        }

        html += `
            <a class="destaque-item" href="noticia.html?id=${d.id}">
                <div>
                    <span class="cat">${seguro(d.categoria)}</span>
                    <h4>${seguro(d.titulo)}</h4>
                    <span class="data">${dataCurta(d.criado_em)}</span>
                </div>
                ${fotinha}
            </a>`
    }

    document.getElementById('lista-destaques').innerHTML = html
    document.getElementById('capa').hidden = false
}

function buscarNoticia(){
    var digitado = document.getElementById('busca').value.trim()
    var texto = digitado.toLowerCase()
    var cartoes = document.querySelectorAll('#grade-noticias .noticia-card')
    var achadas = 0

    for(var i = 0; i < cartoes.length; i++){
        var titulo = cartoes[i].querySelector('h3').textContent.toLowerCase()

        if(!titulo.includes(texto)){
            cartoes[i].hidden = true
        }else{
            cartoes[i].hidden = false
            achadas = achadas + 1
        }
    }

    var titulos = document.querySelectorAll('#grade-noticias .dia-noticias')

    if(texto == ''){
        document.getElementById('tituloLista').textContent = 'Todas as notícias'
        document.getElementById('semResultado').hidden = true
        if(todasNoticias.length > 0){
            document.getElementById('capa').hidden = false
        }
        for(var i = 0; i < titulos.length; i++){
            titulos[i].hidden = false
        }
        return
    }

    document.getElementById('capa').hidden = true
    document.getElementById('tituloLista').textContent = 'Resultados para "' + digitado + '"'
    if(achadas == 0){
        document.getElementById('semResultado').hidden = false
    }else{
        document.getElementById('semResultado').hidden = true
    }
    for(var i = 0; i < titulos.length; i++){
        titulos[i].hidden = true
    }
}

function porDia(noticias){
    var ordem = noticias

    var html = ''
    var diaAtual = ''
    var contagem = {}

    for(var i = 0; i < ordem.length; i++){
        var dia = ordem[i].criado_em.split(' ')[0]

        if(contagem[dia] == null){
            contagem[dia] = 0
        }
        contagem[dia] = contagem[dia] + 1
    }

    for(var i = 0; i < ordem.length; i++){
        var n = ordem[i]
        var dia = n.criado_em.split(' ')[0]

        if(dia != diaAtual){
            diaAtual = dia
            var plural = 'notícia'
            if(contagem[dia] > 1){
                plural = 'notícias'
            }
            html += `<div class="dia-noticias"><h3>${nomeDoDia(n.criado_em)}</h3><span>${contagem[dia]} ${plural}</span></div>`
        }

        html += htmlCartao(n)
    }

    return html
}

function nomeDoDia(data){
    var partes = data.split(' ')[0].split('-')
    var d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
    var semana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

    return semana[d.getDay()] + ', ' + dataCurta(data)
}

function diasDasNoticias(noticias){
    var dias = []

    for(var i = noticias.length - 1; i >= 0; i--){
        var dia = noticias[i].criado_em.split(' ')[0]

        if(!dias.includes(dia)){
            dias.push(dia)
        }
    }

    return dias
}

function mostrarDias(noticias){
    var dias = diasDasNoticias(noticias)
    var caixa = document.getElementById('dias')

    if(dias.length < 2){
        caixa.hidden = true
        diaEscolhido = ''
        return
    }

    var classe = ''
    if(diaEscolhido == ''){
        classe = 'ativo'
    }

    var html = `<button class="${classe}" onclick="escolherDia('')">Todos os dias</button>`

    for(var i = 0; i < dias.length; i++){
        classe = ''
        if(dias[i] == diaEscolhido){
            classe = 'ativo'
        }

        html += `<button class="${classe}" onclick="escolherDia('${dias[i]}')">Dia ${i + 1}<small>${diaEMes(dias[i])}</small></button>`
    }

    caixa.innerHTML = html
    caixa.hidden = false
}

function escolherDia(dia){
    diaEscolhido = dia
    mostrarDias(todasNoticias)

    var html = porDia(doDia(todasNoticias))
    if(html == ''){
        html = '<p class="aviso">Nenhuma notícia nesse dia.</p>'
    }

    document.getElementById('grade-noticias').innerHTML = html
    buscarNoticia()
}

function doDia(noticias){
    if(diaEscolhido == ''){
        return noticias
    }

    var lista = []

    for(var i = 0; i < noticias.length; i++){
        if(noticias[i].criado_em.split(' ')[0] == diaEscolhido){
            lista.push(noticias[i])
        }
    }

    return lista
}

function mostrarDataDaCobertura(noticias){
    var dias = diasDasNoticias(noticias)

    if(dias.length == 0){
        return
    }

    var texto = dataCurta(dias[0] + ' 00:00')
    if(dias.length > 1){
        texto = diaEMes(dias[0]) + ' a ' + dataCurta(dias[dias.length - 1] + ' 00:00')
    }

    document.getElementById('cobertura').textContent = 'Cobertura oficial da Simulação Senac, ' + texto
}
