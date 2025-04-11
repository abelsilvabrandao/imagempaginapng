// Animação do fundo tecnológico
function createTechBackground() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('techBackground');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    container.appendChild(canvas);
    window.addEventListener('resize', resizeCanvas);

    const nodes = [];
    const nodeCount = 50; // Aumentado para mais nós

    // Criar nós
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8, // Velocidade aumentada
            vy: (Math.random() - 0.5) * 0.8  // Velocidade aumentada
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 64, 0, 0.2)'; // Verde mais escuro
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.4)'; // Linhas mais visíveis

        // Atualizar posições dos nós
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2); // Nós maiores
            ctx.fill();
        });

        // Desenhar linhas entre nós próximos
        nodes.forEach((node1, i) => {
            nodes.slice(i + 1).forEach(node2 => {
                const dx = node2.x - node1.x;
                const dy = node2.y - node1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) { // Distância aumentada
                    ctx.beginPath();
                    ctx.moveTo(node1.x, node1.y);
                    ctx.lineTo(node2.x, node2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Inicializar a animação do fundo
createTechBackground();

// Gerenciar preview e remoção de imagens
let selectedFiles = [];

document.getElementById('imageInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
        alert('Você pode selecionar no máximo 5 imagens!');
        return;
    }

    files.forEach(file => {
        if (selectedFiles.length >= 5) return;

        const reader = new FileReader();
        reader.onload = function createPreviewItem(e) {
            const div = document.createElement('div');
            div.className = 'preview-item';

            const img = document.createElement('img');
            img.src = e.target.result;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×'; // Usando o símbolo de multiplicação para um X mais elegante
            removeBtn.setAttribute('title', 'Remover imagem');
            removeBtn.setAttribute('aria-label', 'Remover imagem');
            
            // Adicionar efeito de fade out ao remover
            removeBtn.onclick = function() {
                div.style.transition = 'all 0.3s ease';
                div.style.opacity = '0';
                div.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    div.remove();
                    updateSizeEstimate();
                }, 300);
            };

            div.appendChild(img);
            div.appendChild(removeBtn);
            
            // Adicionar com efeito de fade in
            div.style.opacity = '0';
            div.style.transform = 'scale(0.9)';
            document.getElementById('preview').appendChild(div);
            
            // Forçar reflow
            div.offsetHeight;
            
            // Animar entrada
            div.style.transition = 'all 0.3s ease';
            div.style.opacity = '1';
            div.style.transform = 'scale(1)';
            
            selectedFiles.push(file);
            updateSizeEstimate();
        };
        reader.readAsDataURL(file);
    });
});

// Limpar mensagem de tamanho
function updateSizeEstimate() {
    const sizeElement = document.getElementById('sizeEstimate');
    sizeElement.textContent = '';
    sizeElement.className = 'file-size';
}

async function generateImage() {
    const preview = document.getElementById('preview');
    const images = preview.getElementsByTagName('img');
    const filenameInput = document.getElementById('filename');
    
    if (images.length === 0) {
        alert('Por favor, selecione pelo menos uma imagem.');
        return;
    }

    // Validar nome do arquivo
    const filename = filenameInput.value.trim();
    if (!filename) {
        alert('Por favor, digite um nome para o arquivo.');
        filenameInput.focus();
        return;
    }

    const loader = document.getElementById('loader');
    const progressBar = loader.querySelector('.progress-bar');
    const progressText = loader.querySelector('.progress-text');
    const previewTitle = document.getElementById('previewTitle');
    
    // Resetar e mostrar barra de progresso
    loader.classList.add('active');
    progressBar.style.width = '0%';
    progressBar.classList.add('animated');
    progressText.textContent = 'Preparando imagens...';

    // Simular progresso durante o processamento
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15;
            progressBar.style.width = Math.min(progress, 90) + '%';
            
            if (progress < 30) {
                progressText.textContent = 'Preparando imagens...';
            } else if (progress < 60) {
                progressText.textContent = 'Gerando páginas A4...';
            } else {
                progressText.textContent = 'Finalizando PNG...';
            }
        }
    }, 500);

    // Configurar tamanho do canvas para A4 em 300 DPI
    const dpi = 300;
    const mmToInch = 1 / 25.4;
    const A4_WIDTH = Math.floor(210 * mmToInch * dpi); // A4 width in mm
    const A4_HEIGHT = Math.floor(297 * mmToInch * dpi); // A4 height in mm
    const PAGE_SPACING = Math.floor(20 * mmToInch * dpi); // 20mm de espaço entre páginas

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Ajustar altura do canvas para incluir espaços entre páginas
    const totalHeight = (A4_HEIGHT * images.length) + (PAGE_SPACING * (images.length - 1));
    canvas.width = A4_WIDTH;
    canvas.height = totalHeight;

    // Fundo transparente
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        // Processar cada imagem
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const pageY = i * (A4_HEIGHT + PAGE_SPACING);

            // Desenhar fundo branco para cada página
            ctx.fillStyle = 'white';
            ctx.fillRect(0, pageY, A4_WIDTH, A4_HEIGHT);

            // Adicionar sombra sutil à página
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            // Calcular dimensões mantendo a proporção
            let scale = Math.min(
                (A4_WIDTH * 0.8) / img.naturalWidth,
                (A4_HEIGHT * 0.8) / img.naturalHeight
            );
            let width = img.naturalWidth * scale;
            let height = img.naturalHeight * scale;

            // Centralizar imagem na página
            let x = (A4_WIDTH - width) / 2;
            let y = pageY + (A4_HEIGHT - height) / 2;

            // Resetar sombra antes de desenhar a imagem
            ctx.shadowColor = 'transparent';
            
            // Desenhar imagem
            ctx.drawImage(img, x, y, width, height);
        }

        // Converter para PNG
        const finalPreview = document.getElementById('finalPreview');
        const downloadLink = document.getElementById('downloadLink');
        const filenameInput = document.getElementById('filename');
        const filename = filenameInput.value.trim() || 'saida';

        // Atualizar nome do arquivo no input se estiver vazio
        if (!filenameInput.value.trim()) {
            filenameInput.value = 'saida';
        }

        const pngData = canvas.toDataURL('image/png');
        
        // Calcular tamanho real do PNG
        const binaryString = atob(pngData.split(',')[1]);
        const actualSizeBytes = binaryString.length;
        const actualSizeMB = (actualSizeBytes / (1024 * 1024)).toFixed(1);

        // Atualizar elemento de tamanho com classe apropriada
        const sizeElement = document.getElementById('sizeEstimate');
        sizeElement.textContent = `Tamanho do PNG gerado: ${actualSizeMB} MB`;
        sizeElement.className = 'file-size';

        if (actualSizeBytes > 30 * 1024 * 1024) {
            sizeElement.classList.add('error');
            sizeElement.textContent += ' \u26A0 Arquivo muito grande! Pode haver problemas no processamento.';
        } else if (actualSizeBytes > 20 * 1024 * 1024) {
            sizeElement.classList.add('warning');
            sizeElement.textContent += ' \u26A0 Arquivo grande, considere reduzir a quantidade de imagens.';
        } else {
            sizeElement.classList.add('success');
            sizeElement.textContent += ' \u2714 Tamanho ideal para processamento.';
        }

        // Completar a barra de progresso
        progressBar.style.width = '100%';
        progressText.textContent = 'PNG gerado com sucesso!';
        setTimeout(() => {
            progressBar.classList.remove('animated');
        }, 500);
        clearInterval(progressInterval);
        
        // Mostrar prévia
        finalPreview.src = pngData;
        finalPreview.classList.add('active');
        previewTitle.style.display = 'block';
        
        // Configurar link de download
        downloadLink.href = pngData;
        downloadLink.download = `${filename}.png`;
        downloadLink.style.display = 'inline-block';
        downloadLink.classList.add('download-button');

        // Rolar até a prévia
        finalPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        progressText.textContent = 'Erro ao gerar imagem!';
        progressBar.style.backgroundColor = '#f44336';
        alert('Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.');
    } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
            loader.classList.remove('active');
            progressBar.style.backgroundColor = '';
        }, 1000);
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}