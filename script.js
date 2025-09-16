// ===================================================================================
// INITIALIZATION & GLOBAL STATE
// ===================================================================================

// 전역 상태 관리 객체
let appState = {
    service: '',
    platform: '',
    mood: { soft: 50, static: 50 },
    keyword: '',
    primaryColor: '',
    generatedResult: null // 생성된 최종 결과 저장
};

// 지식 베이스 데이터 저장 변수
let knowledgeBase = {};

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        const response = await fetch('./knowledge_base.json');
        if (!response.ok) throw new Error('Network response was not ok');
        knowledgeBase = await response.json();
        
        setupNavigation();
        initializeMainPage();
        initializeLabPage();

    } catch (error) {
        console.error('Failed to initialize app:', error);
        updateAIMessage("시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.");
    }
}


// ===================================================================================
// NAVIGATION
// ===================================================================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .interactive-button');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.dataset.target;
            
            document.querySelectorAll('.main-page, .lab-page').forEach(page => {
                page.classList.remove('active');
                page.classList.add('hidden');
            });
            
            const targetPage = document.getElementById(targetId);
            if(targetPage) {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('active');
            }

            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.toggle('active', nav.dataset.target === targetId);
            });

            // If navigating to lab, pass generated data
            if (targetId === 'lab-page' && appState.generatedResult) {
                const { bgColor, textColor, fontSize } = appState.generatedResult;
                updateLabPageWithData(bgColor, textColor, fontSize);
            }
        });
    });
}


// ===================================================================================
// MAIN PAGE LOGIC (STEP 1, 2, 3 복구)
// ===================================================================================

function initializeMainPage() {
    initializeDropdowns();
    initializeSliders();
    document.getElementById('generate-btn').addEventListener('click', generateGuide);
    updateAIMessage("안녕하세요! TYPOUNIVERSE AI Design Assistant입니다. 어떤 프로젝트를 위한 디자인 가이드를 찾으시나요? 먼저 서비스의 목적과 타겟 플랫폼을 알려주세요.");
}

function initializeDropdowns() {
    const services = ['포트폴리오', '브랜드 홍보', '제품 판매', '정보 전달', '학습', '엔터테인먼트'];
    const platforms = ['iOS', 'Android', 'Web', 'Desktop', 'Tablet', 'Wearable', 'VR'];
    
    populateDropdown('service', services);
    populateDropdown('platform', platforms);

    document.getElementById('service-dropdown').addEventListener('click', () => toggleDropdown('service'));
    document.getElementById('platform-dropdown').addEventListener('click', () => toggleDropdown('platform'));
}

function populateDropdown(type, options) {
    const menu = document.getElementById(`${type}-menu`);
    menu.innerHTML = '';
    options.forEach(optionText => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.textContent = optionText;
        option.onclick = () => selectOption(type, optionText);
        menu.appendChild(option);
    });
}

function toggleDropdown(type) {
    document.getElementById(`${type}-menu`).classList.toggle('show');
}

function selectOption(type, value) {
    document.getElementById(`${type}-text`).textContent = value;
    document.getElementById(`${type}-dropdown`).classList.add('selected');
    appState[type] = value;
    toggleDropdown(type);

    if (appState.service && appState.platform) {
        document.getElementById('step02').classList.remove('hidden');
        const platformKey = appState.platform.toLowerCase();
        const platformGuide = knowledgeBase.guidelines[platformKey];
        if (platformGuide) {
            updateAIMessage(`${appState.platform} 플랫폼을 선택하셨군요! ${platformGuide.description} 권장 본문 크기는 ${platformGuide.defaultSize}입니다. 이제 서비스의 핵심 분위기를 정해주세요.`);
        }
    }
}

function initializeSliders() {
    const softHardSlider = document.getElementById('soft-hard-slider');
    const staticDynamicSlider = document.getElementById('static-dynamic-slider');
    
    const updateMoodAndKeywords = () => {
        appState.mood.soft = parseInt(softHardSlider.value);
        appState.mood.static = parseInt(staticDynamicSlider.value);
        
        if (Math.abs(appState.mood.soft - 50) > 10 || Math.abs(appState.mood.static - 50) > 10) {
            document.getElementById('step03').classList.remove('hidden');
            renderKeywords();
        }
    };
    
    softHardSlider.addEventListener('input', updateMoodAndKeywords);
    staticDynamicSlider.addEventListener('input', updateMoodAndKeywords);
}

function renderKeywords() {
    const { soft, static: staticMood } = appState.mood;
    let group = (soft < 40 && staticMood >= 60) ? 'group1' :
                (soft < 40 && staticMood < 40) ? 'group2' :
                (soft >= 60 && staticMood < 40) ? 'group3' :
                (soft >= 60 && staticMood >= 60) ? 'group4' : 'group5';
    
    const { keywords, description } = knowledgeBase.iri_colors[group];
    const keywordContainer = document.getElementById('keyword-tags');
    keywordContainer.innerHTML = '';
    
    keywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'tag tag-light';
        tag.textContent = keyword;
        tag.onclick = () => selectKeyword(keyword, group);
        keywordContainer.appendChild(tag);
    });

    updateAIMessage(`선택하신 '${description}' 분위기에 맞는 키워드들을 확인해 보세요.`);
}

function selectKeyword(keyword, group) {
    appState.keyword = keyword;
    
    document.querySelectorAll('#keyword-tags .tag').forEach(tag => {
        tag.classList.toggle('selected', tag.textContent === keyword);
        tag.classList.toggle('tag-purple', tag.textContent === keyword);
    });

    const { key_colors } = knowledgeBase.iri_colors[group];
    const colorContainer = document.getElementById('color-selection');
    colorContainer.innerHTML = '';

    key_colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = color;
        swatch.onclick = () => selectColor(color);
        colorContainer.appendChild(swatch);
    });

    document.getElementById('color-selection-wrapper').style.display = 'block';
    updateAIMessage(`선택하신 '${keyword}' 키워드에 어울리는 대표 색상들을 제안합니다. 주조 색상을 선택해주세요.`);
}

function selectColor(color) {
    appState.primaryColor = color;
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('selected', swatch.style.backgroundColor === color);
    });
    document.getElementById('generate-btn').classList.remove('hidden');
    updateAIMessage("최고의 선택입니다! 이 색상을 기준으로 가이드를 생성합니다.");
}

function generateGuide() {
    const { primaryColor, platform } = appState;
    if (!primaryColor || !platform) {
        alert("주조 색상과 플랫폼을 선택해주세요.");
        return;
    }

    // --- Palette Generation ---
    const primary = primaryColor;
    const primaryLight = lightenColor(primary, 20);
    const primaryDark = darkenColor(primary, 20);
    const secondary = getComplementaryColor(primary);
    const secondaryLight = lightenColor(secondary, 20);
    const secondaryDark = darkenColor(secondary, 20);
    
    // --- Typography & Accessibility ---
    const platformKey = platform.toLowerCase();
    const platformGuide = knowledgeBase.guidelines[platformKey] || knowledgeBase.guidelines.web;
    const textColorOnPrimary = getContrastRatio(primary, '#FFFFFF') > getContrastRatio(primary, '#333333') ? '#FFFFFF' : '#333333';
    const contrastRatio = getContrastRatio(primary, textColorOnPrimary).toFixed(2) + ':1';
    
    // --- Store Results ---
    appState.generatedResult = {
        bgColor: primary,
        textColor: textColorOnPrimary,
        fontSize: parseInt(platformGuide.defaultSize),
        palette: { primary, primaryLight, primaryDark, secondary, secondaryLight, secondaryDark },
        typography: {
            bodySize: platformGuide.defaultSize,
            headlineSize: platformGuide.typeScale.headline || platformGuide.typeScale.largeTitle,
            minimumSize: platformGuide.minimumSize,
            unit: platformGuide.font.unit,
            source: platformGuide.source
        },
        accessibility: {
            textColorOnPrimary,
            contrastRatio
        }
    };

    displayGeneratedGuide();
}

function displayGeneratedGuide() {
    const { palette, typography, accessibility } = appState.generatedResult;

    // Color Display
    document.getElementById('primary-main').style.background = palette.primary;
    document.getElementById('primary-main').querySelector('.color-code').textContent = palette.primary;
    document.getElementById('primary-light').style.background = palette.primaryLight;
    document.getElementById('primary-light').querySelector('.color-code').textContent = palette.primaryLight;
    document.getElementById('primary-dark').style.background = palette.primaryDark;
    document.getElementById('primary-dark').querySelector('.color-code').textContent = palette.primaryDark;
    
    document.getElementById('secondary-main').style.background = palette.secondary;
    document.getElementById('secondary-main').querySelector('.color-code').textContent = palette.secondary;
    document.getElementById('secondary-light').style.background = palette.secondaryLight;
    document.getElementById('secondary-light').querySelector('.color-code').textContent = palette.secondaryLight;
    document.getElementById('secondary-dark').style.background = palette.secondaryDark;
    document.getElementById('secondary-dark').querySelector('.color-code').textContent = palette.secondaryDark;

    // Typography Display
    document.getElementById('contrast-description').innerHTML = `Primary 색상 배경 사용 시, WCAG AA 기준을 충족하는 텍스트 색상은 <strong>${accessibility.textColorOnPrimary}</strong>이며, 대비는 <strong>${accessibility.contrastRatio}</strong>입니다.`;
    document.getElementById('font-size-description').innerHTML = `<strong>${typography.bodySize}</strong> (본문) / <strong>${typography.headlineSize}</strong> (헤드라인)<br>최소 크기: <strong>${typography.minimumSize}</strong> / 단위: <strong>${typography.unit}</strong><br><span style="font-size: 12px; color: #888;">${typography.source}</span>`;

    document.getElementById('ai-report').style.display = 'block';
    document.getElementById('guidelines').style.display = 'grid';
    updateAIMessage(`${appState.platform} 플랫폼에 최적화된 디자인 가이드가 생성되었습니다! 인터랙티브 실험실에서 더 자세히 테스트해보세요.`);
}


// ===================================================================================
// LAB PAGE LOGIC
// ===================================================================================

function initializeLabPage() {
    const elements = {
        bgColorInput: document.getElementById('bg-color-input'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        textColorInput: document.getElementById('text-color-input'),
        textColorPicker: document.getElementById('text-color-picker'),
        lineHeightInput: document.getElementById('line-height-input'),
        fontSizeInput: document.getElementById('font-size-input'),
    };

    const updateAllLabDisplays = () => {
        updateContrastDisplay();
        updateUniversalColorDisplay();
        updateFontUnits();
    };
    
    elements.bgColorInput.oninput = (e) => { elements.bgColorPicker.value = e.target.value; updateAllLabDisplays(); };
    elements.bgColorPicker.oninput = (e) => { elements.bgColorInput.value = e.target.value; updateAllLabDisplays(); };
    elements.textColorInput.oninput = (e) => { elements.textColorPicker.value = e.target.value; updateAllLabDisplays(); };
    elements.textColorPicker.oninput = (e) => { elements.textColorInput.value = e.target.value; updateAllLabDisplays(); };
    elements.lineHeightInput.oninput = () => updateContrastDisplay();
    elements.fontSizeInput.oninput = () => updateFontUnits();

    document.querySelectorAll('input[name="cbType"]').forEach(radio => {
        radio.addEventListener('change', updateUniversalColorDisplay);
    });
    
    updateAllLabDisplays(); // Initial render
}

function updateLabPageWithData(bgColor, textColor, fontSize) {
    document.getElementById('bg-color-input').value = bgColor;
    document.getElementById('bg-color-picker').value = bgColor;
    document.getElementById('text-color-input').value = textColor;
    document.getElementById('text-color-picker').value = textColor;
    document.getElementById('font-size-input').value = fontSize;
    
    updateContrastDisplay();
    updateUniversalColorDisplay();
    updateFontUnits();
}

// updateContrastDisplay 함수 수정
function updateContrastDisplay() {
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;
    const lineHeight = document.getElementById('line-height-input').value;

    const ratio = getContrastRatio(bgColor, textColor);
    document.getElementById('contrast-ratio').textContent = `${ratio.toFixed(2)} : 1`;

    const aaPass = ratio >= 4.5;
    const aaaPass = ratio >= 7;
    
    document.getElementById('aa-status').classList.toggle('pass', aaPass);
    document.getElementById('aa-status').classList.toggle('fail', !aaPass);
    document.getElementById('aaa-status').classList.toggle('pass', aaaPass);
    document.getElementById('aaa-status').classList.toggle('fail', !aaaPass);
    
    // 상태에 따른 정보 메시지 색상 변경
    const infoElement = document.getElementById('contrast-info');
    if (aaPass) {
        infoElement.innerHTML = 'WCAG 2.1 기준, 일반 텍스트는 4.5:1(AA), 7:1(AAA) 이상이어야 합니다.<br><span style="color: #4caf50;">기준을 통과했습니다.</span>';
    } else {
        infoElement.innerHTML = 'WCAG 2.1 기준, 일반 텍스트는 4.5:1(AA), 7:1(AAA) 이상이어야 합니다.<br><span style="color: #f44336;">기준에 미달합니다.</span>';
    }
    
    const preview = document.getElementById('text-preview');
    preview.style.backgroundColor = bgColor;
    preview.style.color = textColor;
    preview.style.lineHeight = lineHeight;
    document.getElementById('line-height-value').textContent = lineHeight;
}

// updateUniversalColorDisplay 함수 수정 (적록색약만 표시)
function updateUniversalColorDisplay() {
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;

    // Update Original Colors (일반 시각)
    updateColorBox('origBg', bgColor, textColor);
    updateColorBox('origText', textColor, bgColor);

    // Update Simulated Colors (적록색약 시각 - 항상 적록색약으로 표시)
    const simBgColor = simulateColor(bgColor, 'redgreen');
    const simTextColor = simulateColor(textColor, 'redgreen');
    updateColorBox('simBg', simBgColor, simTextColor);
    updateColorBox('simText', simTextColor, simBgColor);

    // Update AI Solution
    const simRatio = getContrastRatio(simBgColor, simTextColor);
    const solutionText = document.getElementById('solution-text');
    if (simRatio < 4.5) {
        solutionText.innerHTML = `⚠️ <span style="font-weight:bold;">주의:</span> 적록색약 시각에서 대비율이 ${simRatio.toFixed(2)}:1로 낮아 구분이 어렵습니다.<br>명도 차이를 더 확보하거나, 아이콘/패턴 등의 추가적인 구분 요소를 사용하세요.`;
        solutionText.style.color = '#D9534F';
    } else {
        solutionText.innerHTML = `✅ <span style="font-weight:bold;">양호:</span> 적록색약 시각에서도 대비율이 ${simRatio.toFixed(2)}:1로 충분하여 색상 구분에 문제가 없습니다.`;
        solutionText.style.color = '#5CB85C';
    }
}

// updateColorBox 함수 수정 (텍스트 가독성 개선)
function updateColorBox(id, bgColor, labelColor) {
    const box = document.getElementById(id);
    if (!box) return;
    box.style.backgroundColor = bgColor;
    box.querySelector('.hex-code-sim').textContent = bgColor.toUpperCase();
    
    // 배경색에 따른 텍스트 색상 자동 조정
    const label = box.querySelector('.palette-label');
    const hexCode = box.querySelector('.hex-code-sim');
    const textColor = getContrastRatio(bgColor, '#FFFFFF') > getContrastRatio(bgColor, '#333333') ? '#FFFFFF' : '#333333';
    label.style.color = textColor;
    hexCode.style.color = textColor;
}
function simulateColor(hex, type) {
    const rgb = hexToRgb(hex);
    if (!rgb || !colorBlindnessMatrices[type]) return hex;
    
    const matrix = colorBlindnessMatrices[type];
    const r = Math.round(rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2]);
    const g = Math.round(rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2]);
    const b = Math.round(rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2]);
    
    return rgbToHex(
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b))
    );
}

// ===================================================================================
// UTILITY & HELPER FUNCTIONS
// ===================================================================================

function updateAIMessage(message) {
    const container = document.getElementById('ai-message');
    container.innerHTML = ''; // Clear previous message
    let i = 0;
    const speed = 20;

    function typeWriter() {
        if (i < message.length) {
            container.innerHTML += message.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            container.innerHTML += '<span class="typing-cursor">|</span>';
            setTimeout(() => {
                 if (container.querySelector('.typing-cursor')) {
                    container.querySelector('.typing-cursor').style.display = 'none';
                 }
            }, 1000);
        }
    }
    typeWriter();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const sRGB = [rgb.r, rgb.g, rgb.b].map(val => {
        val /= 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return sRGB[0] * 0.2126 + sRGB[1] * 0.7152 + sRGB[2] * 0.0722;
}

function getContrastRatio(color1, color2) {
    try {
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    } catch (e) {
        return 1;
    }
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (0x1000000 + (R << 16) | (G << 8) | B).toString(16).slice(1).toUpperCase();
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return "#" + (0x1000000 + (R << 16) | (G << 8) | B).toString(16).slice(1).toUpperCase();
}

function getComplementaryColor(color) {
    const rgb = hexToRgb(color);
    if(!rgb) return '#FFFFFF';
    const r = 255 - rgb.r;
    const g = 255 - rgb.g;
    const b = 255 - rgb.b;
    return rgbToHex(r, g, b);
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-wrapper')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});