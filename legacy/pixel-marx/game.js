(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const ui = {
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    qualityButtons: Array.from(document.querySelectorAll('[data-graphics-quality]')),
    graphicsHint: document.getElementById('graphicsHint'),
    chapterButtons: Array.from(document.querySelectorAll('[data-chapter]')),
    chapterTitle: document.getElementById('chapterTitle'),
    conceptText: document.getElementById('conceptText'),
    objectiveText: document.getElementById('objectiveText'),
    philosophyText: document.getElementById('philosophyText'),
    hpFill: document.getElementById('hpFill'),
    skillFill: document.getElementById('skillFill'),
    scoreText: document.getElementById('scoreText'),
    dialogBox: document.getElementById('dialogBox'),
    dialogSpeaker: document.getElementById('dialogSpeaker'),
    dialogText: document.getElementById('dialogText'),
    knowledgeModal: document.getElementById('knowledgeModal'),
    knowledgeTitle: document.getElementById('knowledgeTitle'),
    knowledgeConcept: document.getElementById('knowledgeConcept'),
    knowledgeBody: document.getElementById('knowledgeBody'),
    knowledgeList: document.getElementById('knowledgeList'),
    knowledgeMapping: document.getElementById('knowledgeMapping'),
    knowledgeSource: document.getElementById('knowledgeSource'),
    knowledgeClose: document.getElementById('knowledgeClose'),
    chapterTransition: document.getElementById('chapterTransition'),
    transitionKicker: document.getElementById('transitionKicker'),
    transitionTitle: document.getElementById('transitionTitle'),
    transitionConcept: document.getElementById('transitionConcept'),
  };

  const uiCache = new Map();

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_Y = 468;
  const GRAVITY = 1600;
  const PLAYER_SPEED = 230;
  const JUMP_SPEED = 610;
  const SESSION_UNLOCK_KEY = 'pixelMarxUnlockedChapters';
  const GRAPHICS_QUALITY_KEY = 'pixelMarxGraphicsQuality';

  const graphics = {
    quality: loadGraphicsQuality(),
    autoDetected: !hasSavedGraphicsPreference(),
  };

  const ASSET_ROOT = 'assets/kenney/pixel-platformer';
  const ASSET_MANIFEST = {
    bgPlain: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0000.png`,
    bgStars: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0009.png`,
    bgMine: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0006.png`,
    bgForest: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0012.png`,
    bgTower: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0018.png`,
    bgCity: `${ASSET_ROOT}/Tiles/Backgrounds/tile_0021.png`,
    groundMystic: `${ASSET_ROOT}/Tiles/tile_0000.png`,
    groundMine: `${ASSET_ROOT}/Tiles/tile_0014.png`,
    groundForest: `${ASSET_ROOT}/Tiles/tile_0028.png`,
    groundTower: `${ASSET_ROOT}/Tiles/tile_0042.png`,
    groundCity: `${ASSET_ROOT}/Tiles/tile_0062.png`,
    player: `${ASSET_ROOT}/Tiles/Characters/tile_0000.png`,
    playerAlt: `${ASSET_ROOT}/Tiles/Characters/tile_0004.png`,
    enemyIllusion: `${ASSET_ROOT}/Tiles/Characters/tile_0010.png`,
    enemyFire: `${ASSET_ROOT}/Tiles/Characters/tile_0020.png`,
    enemyIce: `${ASSET_ROOT}/Tiles/Characters/tile_0021.png`,
    enemyStone: `${ASSET_ROOT}/Tiles/Characters/tile_0015.png`,
    boss: `${ASSET_ROOT}/Tiles/Characters/tile_0024.png`,
    ore: `${ASSET_ROOT}/Tiles/tile_0100.png`,
    heart: `${ASSET_ROOT}/Tiles/tile_0101.png`,
    switchTile: `${ASSET_ROOT}/Tiles/tile_0072.png`,
    gate: `${ASSET_ROOT}/Tiles/tile_0084.png`,
    machine: `${ASSET_ROOT}/Tiles/tile_0092.png`,
    portal: `${ASSET_ROOT}/Tiles/tile_0096.png`,
    book: `${ASSET_ROOT}/Tiles/tile_0104.png`,
  };

  const assets = {
    loaded: false,
    images: new Map(),
    failed: [],
  };

  const renderCache = {
    patterns: new Map(),
    backgrounds: new Map(),
  };

  const keys = new Set();
  const justPressed = new Set();
  const mouse = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    down: false,
    justDown: false,
  };

  const state = {
    mode: 'menu',
    chapterIndex: 0,
    scene: null,
    score: 0,
    lastTime: 0,
    shake: 0,
    endingStep: 0,
    endingTimer: 0,
    toastTimer: 0,
    toastText: '',
    knowledgeVisible: false,
  };

  const player = {
    x: 72,
    y: GROUND_Y - 54,
    prevX: 72,
    prevY: GROUND_Y - 54,
    w: 34,
    h: 54,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    hp: 100,
    maxHp: 100,
    attackCooldown: 0,
    attackAnim: 0,
    attackAnimMax: 0.18,
    invuln: 0,
    leapTime: 0,
    inheritTime: 0,
    toolTime: 0,
  };

  const endingSteps = [
    {
      title: 'Giai đoạn 1 — Trực quan sinh động',
      text: 'Người học tiếp xúc với hiện tượng cụ thể: giáo trình, nhiệm vụ, tình huống và các hình ảnh trực quan trong game. Đây là điểm xuất phát cảm tính của quá trình nhận thức.',
      color: '#111827',
    },
    {
      title: 'Giai đoạn 2 — Tư duy trừu tượng',
      text: 'Từ trải nghiệm cụ thể, người học khái quát thành phạm trù và quy luật: vật chất - ý thức, lượng - chất, mâu thuẫn, phủ định của phủ định và duy vật lịch sử.',
      color: '#1e1b4b',
    },
    {
      title: 'Giai đoạn 3 — Thực tiễn',
      text: 'Tri thức chỉ có ý nghĩa đầy đủ khi quay trở lại chỉ đạo hoạt động thực tiễn. Người học dùng nhận thức đúng để định hướng hành động, kiểm nghiệm và cải tạo hiện thực.',
      color: '#052e16',
    },
    {
      title: 'CREDITS',
      text: 'PIXEL MARX: DẤU CHÂN TRIẾT GIA • Sản phẩm sáng tạo MLN111 • Chuyển hóa kiến thức Triết học Mác - Lênin thành trải nghiệm học tập tương tác.',
      color: '#0f172a',
    },
  ];

  const chapters = [
    {
      title: 'Màn 1: Vật chất và Ý thức',
      concept: 'Vật chất là thực tại khách quan; ý thức là sự phản ánh năng động, sáng tạo hiện thực khách quan.',
      objective: 'Dùng K để rà quét, làm rõ cơ sở vật chất của ảo ảnh, phá 2 Khối Vật Chất rồi đánh Berkeley.',
      tip: 'Theo lập trường duy vật biện chứng, phải xuất phát từ tồn tại khách quan; ý thức chỉ có thể tác động trở lại thông qua thực tiễn.',
      colors: ['#1d1235', '#34215f', '#5b3f97'],
      npc: ['Mác-bro', 'Hãy bắt đầu từ thực tại khách quan. Vật chất không phụ thuộc vào cảm giác; ý thức là sự phản ánh năng động, sáng tạo thế giới ấy trong bộ óc người.'],
      knowledge: {
        title: 'Vật chất và ý thức',
        concept: 'Vật chất quyết định ý thức; ý thức có tính độc lập tương đối và tác động trở lại vật chất thông qua thực tiễn.',
        paragraphs: [
          'V.I. Lênin định nghĩa vật chất là phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, được cảm giác chép lại, chụp lại, phản ánh và tồn tại không lệ thuộc vào cảm giác.',
          'Ý thức là hình ảnh chủ quan của thế giới khách quan, là sự phản ánh năng động, sáng tạo hiện thực khách quan của bộ óc người trên cơ sở thực tiễn xã hội - lịch sử.',
        ],
        points: [
          'Vật chất có trước, là nguồn gốc và quyết định nội dung, bản chất, sự vận động của ý thức.',
          'Nguồn gốc trực tiếp và quan trọng nhất của ý thức là lao động, ngôn ngữ và hoạt động thực tiễn xã hội.',
          'Ý thức phản ánh đúng hiện thực có thể định hướng hoạt động thực tiễn, qua đó tác động trở lại thế giới vật chất.',
        ],
        mapping: 'Trong gameplay, kỹ năng Rà quét Thực tại buộc người chơi tìm cơ sở vật chất của ảo ảnh trước khi hành động; đó là cách chuyển luận điểm “xuất phát từ thực tại khách quan” thành cơ chế chơi.',
        source: 'Nguồn: _extracted_tomtat_full.txt, phần Vật chất - Ý thức, khoảng dòng 447-611.',
      },
      setup: setupChapter1,
      update: updateChapter1,
      skill: skillChapter1,
      attack: attackChapter1,
      draw: drawChapter1,
      skillValue: (scene) => scene.local.scanTime > 0 ? 100 : Math.max(0, 100 - scene.local.scanCooldown * 18),
      skillLabel: (scene) => scene.local.scanTime > 0 ? 'Đang rà quét thực tại' : 'Rà quét Thực tại',
    },
    {
      title: 'Màn 2: Quy luật Lượng - Chất',
      concept: 'Sự thay đổi dần dần về lượng đến điểm nút dẫn tới sự thay đổi về chất thông qua bước nhảy.',
      objective: 'Tích lũy đủ Lượng trong Bình Độ, nhấn K tại Điểm Nút để tạo Bước Nhảy và vượt qua Golem Bảo Thủ.',
      tip: 'Cần tích lũy lượng một cách bền bỉ, đồng thời không bỏ lỡ điều kiện để thực hiện bước nhảy về chất.',
      colors: ['#23170d', '#5f3b1d', '#b7791f'],
      npc: ['Ăng-ghen-đại-ca', 'Chất và lượng thống nhất trong mỗi sự vật. Hãy tích lũy lượng đến điểm nút; khi điều kiện chín muồi, bước nhảy sẽ tạo ra chất mới.'],
      knowledge: {
        title: 'Quy luật chuyển hóa từ lượng thành chất và ngược lại',
        concept: 'Chất và lượng là hai mặt thống nhất của sự vật; sự biến đổi về lượng đến giới hạn nhất định sẽ làm biến đổi về chất.',
        paragraphs: [
          'Chất là tính quy định khách quan vốn có của sự vật, là sự thống nhất hữu cơ của các thuộc tính làm cho sự vật là nó và phân biệt nó với sự vật khác.',
          'Lượng là tính quy định khách quan về số lượng, quy mô, trình độ, nhịp điệu, tốc độ vận động và phát triển của sự vật.',
        ],
        points: [
          'Độ là khoảng giới hạn trong đó lượng thay đổi nhưng chất chưa đổi, sự vật vẫn là nó.',
          'Điểm nút là thời điểm lượng tích lũy đủ để làm thay đổi chất.',
          'Bước nhảy là sự chuyển hóa về chất do thay đổi lượng trước đó tạo ra; chất mới lại tác động trở lại lượng mới.',
          'Phương pháp luận: tránh nóng vội duy ý chí khi chưa đủ lượng, đồng thời tránh bảo thủ trì trệ khi điều kiện đổi chất đã chín muồi.',
        ],
        mapping: 'Bình Độ 100% là giới hạn lượng; nhấn K đúng lúc tạo Bước Nhảy, biến năng lực chiến đấu của nhân vật sang chất mới trong thời gian ngắn.',
        source: 'Nguồn: _extracted_tomtat_full.txt, phần Quy luật lượng - chất, khoảng dòng 910-993.',
      },
      setup: setupChapter2,
      update: updateChapter2,
      skill: skillChapter2,
      attack: attackChapter2,
      draw: drawChapter2,
      skillValue: (scene) => scene.local.degree,
      skillLabel: (scene) => player.leapTime > 0 ? 'BƯỚC NHẢY đang bật' : 'Bình Độ',
    },
    {
      title: 'Màn 3: Quy luật Mâu thuẫn',
      concept: 'Sự thống nhất và đấu tranh của các mặt đối lập là nguyên nhân, động lực bên trong của vận động và phát triển.',
      objective: 'Kích hoạt hai mặt đối lập Lửa/Băng, làm mâu thuẫn phát triển tới điều kiện giải quyết rồi xử lý Song Sinh như một chỉnh thể.',
      tip: 'Mặt đối lập vừa nương tựa vừa bài trừ nhau; không giải quyết phiến diện một mặt tách khỏi chỉnh thể mâu thuẫn.',
      colors: ['#052e16', '#064e3b', '#7f1d1d'],
      npc: ['Lênin-senpai', 'Mâu thuẫn biện chứng tồn tại khách quan trong sự vật. Hãy nhận diện hai mặt đối lập, nắm sự thống nhất và đấu tranh của chúng trước khi giải quyết.'],
      knowledge: {
        title: 'Quy luật thống nhất và đấu tranh của các mặt đối lập',
        concept: 'Mâu thuẫn biện chứng là mối liên hệ, tác động qua lại và chuyển hóa lẫn nhau giữa các mặt đối lập.',
        paragraphs: [
          'Mặt đối lập là những mặt, thuộc tính hoặc khuynh hướng vận động trái ngược nhau cùng tồn tại trong một sự vật, hiện tượng.',
          'Trong mỗi mâu thuẫn, các mặt đối lập vừa thống nhất vừa đấu tranh. Thống nhất là sự liên hệ, nương tựa, ràng buộc và làm tiền đề tồn tại cho nhau; đấu tranh là khuynh hướng tác động qua lại, bài trừ, phủ định nhau.',
        ],
        points: [
          'Sự thống nhất của các mặt đối lập có tính tương đối, tạm thời và có điều kiện.',
          'Sự đấu tranh giữa các mặt đối lập có tính tuyệt đối, biểu hiện vận động tuyệt đối của sự vật.',
          'Khi mâu thuẫn phát triển gay gắt và gặp điều kiện thích hợp, các mặt đối lập chuyển hóa, mâu thuẫn được giải quyết, sự vật mới ra đời.',
          'Phương pháp luận: phải phát hiện đúng mâu thuẫn, xác định vị trí và vai trò của từng loại mâu thuẫn để có biện pháp giải quyết phù hợp.',
        ],
        mapping: 'Công tắc Lửa/Băng biểu thị hai mặt đối lập; người chơi phải kích hoạt cả hai, tạo tương tác đấu tranh và giải quyết Song Sinh trong tính chỉnh thể.',
        source: 'Nguồn: _extracted_tomtat_full.txt dòng 994-1058; slide_anh_duc_thong_nhat_mat_doi_lap_v2.md dòng 6-77.',
      },
      setup: setupChapter3,
      update: updateChapter3,
      skill: skillChapter3,
      attack: attackChapter3,
      draw: drawChapter3,
      skillValue: (scene) => scene.local.contradiction,
      skillLabel: () => 'Điều hòa mâu thuẫn',
    },
    {
      title: 'Màn 4: Phủ định của Phủ định',
      concept: 'Sự phát triển đi lên theo đường xoáy ốc: cái mới phủ định cái cũ nhưng vẫn kế thừa hạt nhân hợp lý.',
      objective: 'Vượt qua 3 pha Ouroboros. Click chuột để bắn xa boss trên trời, dùng J để xử lý tàn dư dưới đất.',
      tip: 'Phủ định biện chứng không phải xóa sạch; mỗi vòng phát triển phải kế thừa chọn lọc để đạt trình độ cao hơn.',
      colors: ['#25133f', '#4c1d95', '#7e22ce'],
      npc: ['Ouroboros', 'Ta trở lại sau mỗi lần bị phủ định. Nếu chỉ lặp lại máy móc, ngươi sẽ mắc kẹt; hãy kế thừa cái hợp lý để vượt lên.'],
      knowledge: {
        title: 'Quy luật phủ định của phủ định',
        concept: 'Quy luật này chỉ ra khuynh hướng đi lên, hình thức xoáy ốc và tính kế thừa trong quá trình phát triển.',
        paragraphs: [
          'Phủ định biện chứng là sự phủ định tạo tiền đề cho sự phát triển; nó không xóa bỏ sạch trơn mà kế thừa những yếu tố tích cực của cái cũ.',
          'Phủ định của phủ định làm sự vật dường như quay lại điểm xuất phát về hình thức, nhưng ở trình độ cao hơn và tiến bộ hơn về nội dung.',
        ],
        points: [
          'Sự phát triển không đi theo đường thẳng đơn giản và cũng không quay vòng nguyên trạng, mà vận động theo đường xoáy ốc đi lên.',
          'Mỗi vòng mới vừa lặp lại một số yếu tố cũ, vừa kế thừa chọn lọc, vừa tạo ra chất mới cao hơn.',
          'Phương pháp luận: ủng hộ cái mới, chống bảo thủ giáo điều, đồng thời tránh phủ định sạch trơn hoặc kế thừa nguyên xi cái cũ.',
        ],
        mapping: 'Boss Ouroboros có 3 pha lặp lại ở mức cao hơn. Người chơi dùng bắn xa để xử lý mâu thuẫn mới trên bầu trời, đồng thời dùng J cận chiến để dọn tàn dư dưới mặt đất.',
        source: '',
      },
      setup: setupChapter4,
      update: updateChapter4,
      skill: skillChapter4,
      attack: attackChapter4,
      draw: drawChapter4,
      skillValue: (scene) => scene.local.inheritCharge,
      skillLabel: () => 'Kế thừa biện chứng',
    },
    {
      title: 'Màn 5: Duy vật Lịch sử',
      concept: 'Phương thức sản xuất là sự thống nhất giữa lực lượng sản xuất và quan hệ sản xuất; cơ sở hạ tầng quyết định kiến trúc thượng tầng.',
      objective: 'Nhặt bản vẽ công nghệ, cải tạo các quan hệ sản xuất lạc hậu để làm suy yếu khiên kiến trúc thượng tầng.',
      tip: 'Cơ sở hạ tầng không chỉ là máy móc vật lý, mà là toàn bộ quan hệ sản xuất hiện thực hợp thành cơ cấu kinh tế của xã hội.',
      colors: ['#061826', '#0f766e', '#7c2d12'],
      npc: ['Sinh viên FPT', 'Muốn đổi mới xã hội phải bắt đầu từ trình độ lực lượng sản xuất và các quan hệ sản xuất tương ứng, không chỉ sửa phần ngọn của kiến trúc thượng tầng.'],
      knowledge: {
        title: 'Duy vật lịch sử: LLSX - QHSX, CSHT - KTTT',
        concept: 'Sự vận động của xã hội xét đến cùng bắt nguồn từ sản xuất vật chất và các quy luật của phương thức sản xuất.',
        paragraphs: [
          'Phương thức sản xuất là cách thức con người thực hiện quá trình sản xuất vật chất trong một giai đoạn lịch sử nhất định; đó là sự thống nhất giữa lực lượng sản xuất với một trình độ nhất định và quan hệ sản xuất tương ứng.',
          'Cơ sở hạ tầng là toàn bộ những quan hệ sản xuất của một xã hội trong sự vận động hiện thực của chúng, hợp thành cơ cấu kinh tế của xã hội đó. Kiến trúc thượng tầng là toàn bộ quan điểm, tư tưởng xã hội cùng các thiết chế tương ứng hình thành trên một cơ sở hạ tầng nhất định.',
        ],
        points: [
          'Lực lượng sản xuất quyết định quan hệ sản xuất; quan hệ sản xuất phù hợp thì thúc đẩy, không phù hợp thì kìm hãm lực lượng sản xuất.',
          'Công cụ lao động là yếu tố động, cách mạng trong lực lượng sản xuất; người lao động là nhân tố hàng đầu giữ vai trò quyết định.',
          'Cơ sở hạ tầng quyết định nguồn gốc, cơ cấu, tính chất và sự vận động của kiến trúc thượng tầng; kiến trúc thượng tầng có tính độc lập tương đối và tác động trở lại cơ sở hạ tầng.',
          'Phương pháp luận: tránh tuyệt đối hóa kinh tế hoặc chính trị; đổi mới phải căn cứ vào yêu cầu khách quan của sự phát triển kinh tế - xã hội.',
        ],
        mapping: 'Ba nút cơ sở hạ tầng trong màn chơi tượng trưng cho ba mặt của quan hệ sản xuất: sở hữu, tổ chức - quản lý và phân phối. Khi các quan hệ lạc hậu bị cải tạo, khiên kiến trúc thượng tầng mất cơ sở duy trì.',
        source: 'Nguồn: _extracted_tomtat_full.txt, phần LLSX - QHSX và CSHT - KTTT, khoảng dòng 1328-1567.',
      },
      setup: setupChapter5,
      update: updateChapter5,
      skill: skillChapter5,
      attack: attackChapter5,
      draw: drawChapter5,
      skillValue: (scene) => scene.local.toolCharge,
      skillLabel: (scene) => scene.local.hasTool ? 'Công cụ lao động mới' : 'Chưa có công cụ',
    },
  ];

  window.addEventListener('keydown', (event) => {
    const code = event.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      event.preventDefault();
    }
    if (!keys.has(code)) {
      justPressed.add(code);
    }
    keys.add(code);
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  canvas.addEventListener('mousemove', (event) => {
    const bounds = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    mouse.y = ((event.clientY - bounds.top) / bounds.height) * HEIGHT;
  });

  canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    mouse.down = true;
    mouse.justDown = true;
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouse.down = false;
  });

  ui.startButton.addEventListener('click', () => startGame());
  ui.restartButton.addEventListener('click', () => startGame());
  ui.qualityButtons.forEach((button) => {
    button.addEventListener('click', () => setGraphicsQuality(button.dataset.graphicsQuality));
  });
  ui.chapterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.chapter);
      if (button.disabled || !Number.isInteger(index)) return;
      startGameAt(index);
    });
  });
  ui.knowledgeClose.addEventListener('click', () => hideKnowledgePopup());

  function hasSavedGraphicsPreference() {
    try {
      return localStorage.getItem(GRAPHICS_QUALITY_KEY) === 'low' || localStorage.getItem(GRAPHICS_QUALITY_KEY) === 'high';
    } catch (error) {
      return false;
    }
  }

  function shouldDefaultToLowGraphics() {
    const cores = navigator.hardwareConcurrency || 0;
    const memory = navigator.deviceMemory || 0;
    const narrowScreen = window.matchMedia('(max-width: 760px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slowConnection = navigator.connection && ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);
    return reducedMotion || slowConnection || (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4) || narrowScreen;
  }

  function loadGraphicsQuality() {
    try {
      const saved = localStorage.getItem(GRAPHICS_QUALITY_KEY);
      if (saved === 'low' || saved === 'high') return saved;
    } catch (error) {
      // Fall through to automatic first-run default.
    }
    return shouldDefaultToLowGraphics() ? 'low' : 'high';
  }

  function saveGraphicsQuality(quality) {
    try {
      localStorage.setItem(GRAPHICS_QUALITY_KEY, quality);
    } catch (error) {
      // localStorage can be blocked; keep runtime state only.
    }
  }

  function isLowGraphics() {
    return graphics.quality === 'low';
  }

  function setGraphicsQuality(quality) {
    graphics.quality = quality === 'low' ? 'low' : 'high';
    graphics.autoDetected = false;
    saveGraphicsQuality(graphics.quality);
    updateGraphicsButtons();
    applyGraphicsMode();
  }

  function updateGraphicsButtons() {
    for (const button of ui.qualityButtons) {
      const active = button.dataset.graphicsQuality === graphics.quality;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    if (ui.graphicsHint) {
      const prefix = graphics.autoDetected ? 'Tự chọn theo máy: ' : '';
      setText(ui.graphicsHint, graphics.quality === 'low'
        ? `${prefix}Thấp - giảm animation và hiệu ứng nền để gameplay mượt hơn.`
        : `${prefix}Cao - giữ nguyên toàn bộ hiệu ứng hình ảnh và chuyển động hiện có.`);
    }
  }

  function applyGraphicsMode() {
    document.documentElement.dataset.graphics = graphics.quality;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function rect(x, y, w, h) {
    return { x, y, w, h };
  }

  function consume(codes) {
    for (const code of codes) {
      if (justPressed.has(code)) {
        justPressed.delete(code);
        return true;
      }
    }
    return false;
  }

  function playerRect() {
    return rect(player.x, player.y, player.w, player.h);
  }

  function centerOf(obj) {
    return { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
  }

  function distance(a, b) {
    const ca = centerOf(a);
    const cb = centerOf(b);
    return Math.hypot(ca.x - cb.x, ca.y - cb.y);
  }

  function loadAssets() {
    const entries = Object.entries(ASSET_MANIFEST);
    return Promise.all(entries.map(([name, src]) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        assets.images.set(name, image);
        resolve({ name, ok: true });
      };
      image.onerror = () => {
        assets.failed.push({ name, src });
        resolve({ name, ok: false });
      };
      image.src = src;
    }))).then(() => {
      assets.loaded = true;
      if (assets.failed.length > 0) {
        console.warn('Some Pixel Marx texture assets failed to load; Canvas fallbacks remain active.', assets.failed);
      }
    });
  }

  function assetImage(name) {
    return assets.images.get(name);
  }

  function drawImageAsset(name, x, y, w, h, fallback) {
    const image = assetImage(name);
    if (image) {
      ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      return true;
    }
    if (fallback) fallback();
    return false;
  }

  function drawTintedAsset(name, x, y, w, h, tint, alpha = 0.28, fallback) {
    const drawn = drawImageAsset(name, x, y, w, h, fallback);
    if (drawn && tint) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = tint;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      ctx.restore();
    }
    return drawn;
  }

  function getPattern(name) {
    const image = assetImage(name);
    if (!image) return null;
    if (!renderCache.patterns.has(name)) {
      renderCache.patterns.set(name, ctx.createPattern(image, 'repeat'));
    }
    return renderCache.patterns.get(name);
  }

  function getBackgroundFill(name) {
    if (!renderCache.backgrounds.has(name)) {
      const source = assetImage(name);
      if (!source) return null;
      const canvasTile = document.createElement('canvas');
      canvasTile.width = WIDTH;
      canvasTile.height = HEIGHT;
      const tileCtx = canvasTile.getContext('2d');
      tileCtx.imageSmoothingEnabled = false;
      const pattern = tileCtx.createPattern(source, 'repeat');
      if (pattern) {
        tileCtx.fillStyle = pattern;
        tileCtx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      renderCache.backgrounds.set(name, canvasTile);
    }
    return renderCache.backgrounds.get(name);
  }

  function drawTiledAsset(name, x, y, w, h, tileSize = 36, tint = null, fallback = null) {
    const image = assetImage(name);
    if (!image) {
      if (fallback) fallback();
      return false;
    }
    const pattern = getPattern(name);
    if (pattern && tileSize === 36) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, Math.round(w), Math.round(h));
      if (tint) {
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, Math.round(w), Math.round(h));
      }
      ctx.restore();
      return true;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.clip();
    for (let tx = x; tx < x + w; tx += tileSize) {
      for (let ty = y; ty < y + h; ty += tileSize) {
        ctx.drawImage(image, Math.round(tx), Math.round(ty), tileSize, tileSize);
      }
    }
    if (tint) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = tint;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    ctx.restore();
    return true;
  }

  function chapterTextureName(index = state.chapterIndex) {
    return ['groundMystic', 'groundMine', 'groundForest', 'groundTower', 'groundCity'][index] || 'groundMystic';
  }

  function chapterBackgroundName(index = state.chapterIndex) {
    return ['bgStars', 'bgMine', 'bgForest', 'bgTower', 'bgCity'][index] || 'bgPlain';
  }

  function enemyAssetName(enemy) {
    if (enemy.asset) return enemy.asset;
    const signature = `${enemy.name || ''} ${enemy.color || ''}`;
    if (signature.includes('Lửa') || signature.includes('#ef4444')) return 'enemyFire';
    if (signature.includes('Băng') || signature.includes('#38bdf8')) return 'enemyIce';
    if (enemy.armored || signature.includes('mỏ') || signature.includes('Golem') || signature.includes('#78716c') || signature.includes('#92400e')) return 'enemyStone';
    if (signature.includes('Drone') || signature.includes('luật') || signature.includes('#f43f5e')) return 'machine';
    return 'enemyIllusion';
  }


  function unlockedChapters() {
    try {
      return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'all' ? chapters.map((_, index) => index) : [];
    } catch (error) {
      return [];
    }
  }

  function unlockAllChaptersForSession() {
    try {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'all');
    } catch (error) {
      // Session storage can be unavailable in strict/private browser modes.
    }
    updateChapterButtons();
  }

  function updateChapterButtons() {
    const unlocked = new Set(unlockedChapters());
    for (const button of ui.chapterButtons) {
      const index = Number(button.dataset.chapter);
      const isUnlocked = unlocked.has(index);
      button.disabled = !isUnlocked;
      button.classList.toggle('is-unlocked', isUnlocked);
      button.title = isUnlocked ? `Chơi lại màn ${index + 1}` : 'Phá đảo game trong phiên này để mở chọn màn';
      button.setAttribute('aria-disabled', String(!isUnlocked));
    }
  }

  function startGame() {
    state.score = 0;
    state.mode = 'playing';
    state.chapterIndex = 0;
    state.shake = 0;
    state.endingStep = 0;
    hideKnowledgePopup();
    loadChapter(0);
  }

  function startGameAt(index) {
    if (!unlockedChapters().includes(index)) return;
    state.score = 0;
    state.mode = 'playing';
    state.chapterIndex = index;
    state.shake = 0;
    state.endingStep = 0;
    hideKnowledgePopup();
    loadChapter(index);
  }

  function resetPlayer() {
    player.x = 66;
    player.y = GROUND_Y - player.h;
    player.prevY = player.y;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.onGround = false;
    player.hp = player.maxHp;
    player.attackCooldown = 0;
    player.attackAnim = 0;
    player.invuln = 0;
    player.leapTime = 0;
    player.inheritTime = 0;
    player.toolTime = 0;
  }

  function makeScene() {
    return {
      platforms: [rect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y)],
      enemies: [],
      bosses: [],
      pickups: [],
      cores: [],
      switches: [],
      gates: [],
      machines: [],
      projectiles: [],
      effects: [],
      slashes: [],
      portal: null,
      complete: false,
      completeReason: '',
      local: {},
    };
  }

  function loadChapter(index) {
    state.chapterIndex = index;
    const scene = makeScene();
    state.scene = scene;
    hideKnowledgePopup();
    resetPlayer();
    chapters[index].setup(scene);
    showChapterTransition(index);
    const [speaker, text] = chapters[index].npc;
    showDialog(speaker, text, 5200);
    updateHUD();
  }

  function showChapterTransition(index) {
    if (!ui.chapterTransition) return;
    const chapter = chapters[index];
    ui.transitionKicker.textContent = `Chương ${index + 1}`;
    ui.transitionTitle.textContent = chapter.title;
    ui.transitionConcept.textContent = chapter.concept;
    ui.chapterTransition.classList.add('is-visible');
    ui.chapterTransition.setAttribute('aria-hidden', 'false');
    window.clearTimeout(showChapterTransition.timer);
    showChapterTransition.timer = window.setTimeout(() => {
      ui.chapterTransition.classList.remove('is-visible');
      ui.chapterTransition.setAttribute('aria-hidden', 'true');
    }, 1500);
  }

  function showDialog(speaker, text, duration = 4500) {
    ui.dialogSpeaker.textContent = speaker;
    ui.dialogText.textContent = text;
    ui.dialogBox.classList.add('is-visible');
    state.toastTimer = duration / 1000;
  }

  function hideDialog() {
    ui.dialogBox.classList.remove('is-visible');
    state.toastTimer = 0;
  }

  function quickMessage(text, speaker = 'Hệ thống') {
    showDialog(speaker, text, 2800);
  }

  function showKnowledgePopup(chapter) {
    const knowledge = chapter.knowledge;
    if (!knowledge) return;
    state.knowledgeVisible = true;
    ui.knowledgeTitle.textContent = knowledge.title;
    ui.knowledgeConcept.textContent = knowledge.concept;
    ui.knowledgeBody.innerHTML = '';
    for (const paragraph of knowledge.paragraphs || []) {
      const entry = document.createElement('p');
      entry.textContent = paragraph;
      ui.knowledgeBody.appendChild(entry);
    }
    ui.knowledgeList.innerHTML = '';
    for (const point of knowledge.points || []) {
      const item = document.createElement('li');
      item.textContent = point;
      ui.knowledgeList.appendChild(item);
    }
    ui.knowledgeMapping.textContent = knowledge.mapping ? `Ánh xạ gameplay: ${knowledge.mapping}` : '';
    ui.knowledgeSource.textContent = '';
    ui.knowledgeModal.classList.add('is-visible');
    ui.knowledgeModal.setAttribute('aria-hidden', 'false');
    ui.knowledgeClose.focus({ preventScroll: true });
  }

  function hideKnowledgePopup() {
    state.knowledgeVisible = false;
    ui.knowledgeModal.classList.remove('is-visible');
    ui.knowledgeModal.setAttribute('aria-hidden', 'true');
  }

  function damagePlayer(amount, reason) {
    if (player.invuln > 0 || state.mode !== 'playing') return;
    player.hp = clamp(player.hp - amount, 0, player.maxHp);
    player.invuln = 1.1;
    state.shake = 0.22;
    if (reason) quickMessage(reason, 'Cảnh báo');
    if (player.hp <= 0) {
      quickMessage('Rớt môn tạm thời! Đang hồi sinh tại save point...', 'Game Over');
      setTimeout(() => {
        if (state.mode === 'playing') loadChapter(state.chapterIndex);
      }, 1200);
    }
  }

  function healPlayer(amount) {
    player.hp = clamp(player.hp + amount, 0, player.maxHp);
  }

  function fireRangedShot(scene) {
    const from = centerOf(playerRect());
    const dx = mouse.x - from.x;
    const dy = mouse.y - from.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    player.facing = dx >= 0 ? 1 : -1;
    scene.projectiles.push({
      x: from.x - 5,
      y: from.y - 5,
      w: 12,
      h: 12,
      vx: (dx / len) * 520,
      vy: (dy / len) * 520,
      ttl: 1.25,
      playerShot: true,
      damageBoss: 10,
      color: '#5eead4',
    });
    scene.slashes.push({ x: from.x - 8, y: from.y - 8, w: 16, h: 16, ttl: 0.08, color: '#5eead4' });
  }

  function markComplete(reason) {
    const scene = state.scene;
    if (scene.complete) return;
    scene.complete = true;
    scene.completeReason = reason;
    scene.portal = rect(876, GROUND_Y - 82, 46, 82);
    state.score += 250 + state.chapterIndex * 100;
    showKnowledgePopup(chapters[state.chapterIndex]);
    quickMessage(`${reason} Cổng nhận thức đã mở — đóng bảng tổng kết rồi đứng vào cổng và nhấn E.`, 'Hoàn thành chương');
  }

  function advanceChapter() {
    if (state.chapterIndex < chapters.length - 1) {
      loadChapter(state.chapterIndex + 1);
    } else {
      startEnding();
    }
  }

  function startEnding() {
    unlockAllChaptersForSession();
    state.mode = 'ending';
    state.endingStep = 0;
    state.endingTimer = 0;
    hideDialog();
    hideKnowledgePopup();
    updateHUD();
  }

  function setText(node, text) {
    if (!node) return;
    const value = String(text);
    if (uiCache.get(node) === value) return;
    node.textContent = value;
    uiCache.set(node, value);
  }

  function setWidth(node, percent) {
    if (!node) return;
    const value = `${Math.round(clamp(percent, 0, 100))}%`;
    if (uiCache.get(node) === value) return;
    node.style.width = value;
    uiCache.set(node, value);
  }

  function updateHUD() {
    const previousObjective = ui.objectiveText.textContent;
    if (state.mode === 'menu') {
      setText(ui.chapterTitle, 'Menu chính');
      setText(ui.conceptText, 'Sản phẩm sáng tạo MLN111');
      setText(ui.objectiveText, 'Nhấn “Bắt đầu deadline” để vào Aletheia.');
      setText(ui.philosophyText, 'Triết học Mác - Lênin gắn nhận thức khoa học với hoạt động thực tiễn cải tạo hiện thực.');
      setWidth(ui.hpFill, 100);
      setWidth(ui.skillFill, 0);
      setText(ui.scoreText, '0');
      return;
    }

    if (state.mode === 'ending') {
      setText(ui.chapterTitle, 'Kết thúc: Hành trình nhận thức');
      setText(ui.conceptText, 'Từ trực quan sinh động đến tư duy trừu tượng, rồi trở về thực tiễn.');
      setText(ui.objectiveText, 'Nhấn E hoặc Enter để chuyển cảnh credit.');
      setText(ui.philosophyText, 'Nhận thức chỉ trọn vẹn khi quay lại phục vụ thực tiễn.');
      setWidth(ui.skillFill, 100);
      setText(ui.scoreText, Math.floor(state.score));
      return;
    }

    const chapter = chapters[state.chapterIndex];
    const scene = state.scene;
    setText(ui.chapterTitle, chapter.title);
    setText(ui.conceptText, chapter.concept);
    setText(ui.objectiveText, scene.complete ? 'Đứng vào cổng nhận thức và nhấn E để sang chương tiếp theo.' : chapter.objective);
    setText(ui.philosophyText, `${chapter.tip} — ${chapter.skillLabel(scene)}`);
    setWidth(ui.hpFill, (player.hp / player.maxHp) * 100);
    setWidth(ui.skillFill, chapter.skillValue(scene));
    setText(ui.scoreText, Math.floor(state.score));
    pulseObjective(previousObjective);
  }

  function pulseObjective(previousObjective) {
    if (!ui.objectiveText || previousObjective === ui.objectiveText.textContent) return;
    const card = ui.objectiveText.closest('.objective-card');
    if (!card) return;
    card.classList.remove('is-updated');
    void card.offsetWidth;
    card.classList.add('is-updated');
  }

  function gameLoop(timestamp) {
    const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
    state.lastTime = timestamp;

    if (state.mode === 'menu') {
      updateMenu(dt);
      drawMenu();
    } else if (state.mode === 'playing') {
      updatePlaying(dt);
      drawPlaying();
    } else if (state.mode === 'ending') {
      updateEnding(dt);
      drawEnding();
    }

    updateHUD();
    justPressed.clear();
    mouse.justDown = false;
    requestAnimationFrame(gameLoop);
  }

  function updateMenu() {
    if (consume(['Enter', 'Space'])) startGame();
  }

  function updatePlaying(dt) {
    const scene = state.scene;
    const chapter = chapters[state.chapterIndex];

    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) hideDialog();
    }

    if (state.knowledgeVisible) {
      if (consume(['KeyE', 'Enter', 'Space', 'Escape'])) hideKnowledgePopup();
      return;
    }

    const pressedInteract = consume(['KeyE', 'Enter']);
    let closedDialog = false;
    if (ui.dialogBox.classList.contains('is-visible') && pressedInteract) {
      hideDialog();
      closedDialog = true;
    }

    handlePlayerInput(dt);
    updatePlayerPhysics(dt);
    handleSolidGates(scene);
    updateTimers(dt);

    if (consume(['KeyJ']) && player.attackCooldown <= 0) {
      player.attackCooldown = player.leapTime > 0 ? 0.18 : 0.28;
      player.attackAnimMax = player.leapTime > 0 ? 0.15 : 0.18;
      player.attackAnim = player.attackAnimMax;
      const attackBox = rect(player.facing > 0 ? player.x + player.w - 4 : player.x - 34, player.y + 12, 38, 30);
      chapter.attack(scene, attackBox);
    }

    if (state.chapterIndex >= 3 && mouse.justDown && player.attackCooldown <= 0) {
      player.attackCooldown = 0.34;
      fireRangedShot(scene);
    }

    if (consume(['KeyK'])) {
      chapter.skill(scene);
    }

    if (pressedInteract && !closedDialog) {
      interact(scene);
    }

    chapter.update(scene, dt);
    updateGenericEntities(scene, dt);

    if (scene.portal && overlap(playerRect(), scene.portal) && pressedInteract && !closedDialog) {
      advanceChapter();
      return;
    }

    scene.effects = scene.effects.filter((effect) => (effect.ttl -= dt) > 0);
    scene.slashes = scene.slashes.filter((slash) => (slash.ttl -= dt) > 0);
    state.shake = Math.max(0, state.shake - dt);
  }

  function handlePlayerInput(dt) {
    const left = keys.has('KeyA') || keys.has('ArrowLeft');
    const right = keys.has('KeyD') || keys.has('ArrowRight');
    const jump = consume(['KeyW', 'ArrowUp', 'Space']);

    let axis = 0;
    if (left) axis -= 1;
    if (right) axis += 1;
    player.vx = axis * PLAYER_SPEED * (player.leapTime > 0 ? 1.18 : 1);
    if (axis !== 0) player.facing = axis;

    if (jump && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
    }

    if (player.invuln > 0) {
      player.vx += Math.sin(performance.now() / 28) * 18;
    }

    player.prevX = player.x;
    player.x += player.vx * dt;
    player.x = clamp(player.x, 10, WIDTH - player.w - 10);
  }

  function updatePlayerPhysics(dt) {
    const scene = state.scene;
    player.prevY = player.y;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.onGround = false;

    for (const platform of scene.platforms) {
      const wasAbove = player.prevY + player.h <= platform.y + 8;
      if (overlap(playerRect(), platform) && player.vy >= 0 && wasAbove) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (player.y > HEIGHT + 80) {
      damagePlayer(18, 'Rơi khỏi map: trực quan sinh động quá mức!');
      player.x = 66;
      player.y = GROUND_Y - player.h;
      player.vy = 0;
    }
  }

  function handleSolidGates(scene) {
    for (const gate of scene.gates) {
      if (gate.open || gate.dead) continue;
      if (!overlap(playerRect(), gate)) continue;
      if (player.prevX + player.w <= gate.x) {
        player.x = gate.x - player.w;
      } else if (player.prevX >= gate.x + gate.w) {
        player.x = gate.x + gate.w;
      } else if (player.y + player.h / 2 < gate.y + gate.h / 2) {
        player.y = gate.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.y = gate.y + gate.h;
        player.vy = Math.max(0, player.vy);
      }
    }
  }

  function updateTimers(dt) {
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.attackAnim = Math.max(0, player.attackAnim - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.leapTime = Math.max(0, player.leapTime - dt);
    player.inheritTime = Math.max(0, player.inheritTime - dt);
    player.toolTime = Math.max(0, player.toolTime - dt);
  }

  function updateGenericEntities(scene, dt) {
    for (const pickup of scene.pickups) {
      if (!pickup.taken) {
        pickup.bob = (pickup.bob || 0) + dt * 5;
        if (overlap(playerRect(), pickup)) collectPickup(scene, pickup);
      }
    }

    for (const enemy of scene.enemies) {
      enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
      if (enemy.dead) continue;
      if (enemy.hidden && !enemy.revealed) continue;
      enemy.x += (enemy.vx || 0) * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
        enemy.vx *= -1;
        enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX);
      }
      if (overlap(playerRect(), enemy)) damagePlayer(enemy.damage || 8, `${enemy.name || 'Quái vật'} va chạm: mất tập trung khi chạy deadline.`);
    }

    for (const boss of scene.bosses) {
      boss.flash = Math.max(0, (boss.flash || 0) - dt);
      if (!boss.dead && boss.kind !== 'twin' && overlap(playerRect(), boss)) {
        damagePlayer(boss.damage || 12, `${boss.name} gây áp lực deadline!`);
      }
    }

    for (const projectile of scene.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.ttl -= dt;
      if (projectile.bounce) {
        if (projectile.x <= projectile.minX || projectile.x + projectile.w >= projectile.maxX) {
          projectile.vx *= -1;
          projectile.x = clamp(projectile.x, projectile.minX, projectile.maxX - projectile.w);
          projectile.bounce -= 1;
        }
        if (projectile.y <= projectile.minY || projectile.y + projectile.h >= projectile.maxY) {
          projectile.vy *= -1;
          projectile.y = clamp(projectile.y, projectile.minY, projectile.maxY - projectile.h);
          projectile.bounce -= 1;
        }
        if (projectile.bounce < 0) projectile.ttl = 0;
      }
      if (projectile.playerShot) {
        const boss = scene.bosses[0];
        if (state.chapterIndex === 3 && boss && !boss.dead && overlap(projectile, boss)) {
          projectile.ttl = 0;
          hitOuroboros(scene, boss, projectile.damageBoss || 8);
        }
      } else if (projectile.damage && overlap(playerRect(), projectile)) {
        projectile.ttl = 0;
        damagePlayer(projectile.damage, projectile.message || 'Luận điểm bay trúng người chơi!');
      }
    }
    scene.projectiles = scene.projectiles.filter((p) => p.ttl > 0 && p.x > -80 && p.x < WIDTH + 80 && p.y > -80 && p.y < HEIGHT + 80);
  }

  function collectPickup(scene, pickup) {
    pickup.taken = true;
    state.score += pickup.score || 25;
    if (pickup.kind === 'ore') {
      scene.local.degree = clamp(scene.local.degree + pickup.value, 0, 100);
      quickMessage(`+${pickup.value}% Lượng. Bình Độ hiện ${scene.local.degree}%.`, 'Khu Mỏ');
    }
    if (pickup.kind === 'heart') {
      healPlayer(18);
      quickMessage('Nhặt cà phê ký túc xá: hồi HP.', 'Sinh viên FPT');
    }
    if (pickup.kind === 'blueprint') {
      scene.local.hasTool = true;
      scene.local.toolCharge = 100;
      quickMessage('Đã nhặt Bản vẽ Công nghệ: công cụ lao động mới làm tăng năng lực của lực lượng sản xuất.', 'Duy vật lịch sử');
    }
  }

  function interact(scene) {
    if (state.chapterIndex === 2) {
      for (const sw of scene.switches) {
        if (!sw.active && distance(playerRect(), sw) < 72) {
          sw.active = true;
          scene.local.contradiction = clamp(scene.local.contradiction + 25, 0, 100);
          quickMessage(`Công tắc ${sw.element === 'fire' ? 'Lửa' : 'Băng'} đã bật. Mặt đối lập thứ ${scene.switches.filter((s) => s.active).length}/2 sẵn sàng.`, 'Rừng lưỡng cực');
        }
      }
    }
  }

  function hitActor(actor, amount, label) {
    if (actor.dead) return false;
    actor.hp -= amount;
    actor.flash = 0.14;
    state.score += Math.max(1, Math.floor(amount));
    if (actor.hp <= 0) {
      actor.dead = true;
      state.score += actor.score || 50;
      if (label) quickMessage(label, actor.name || 'Boss');
    }
    return true;
  }

  function drawMenu() {
    const t = performance.now() / 1000;
    drawGradient('#0f172a', '#28153f', '#0891b2');
    drawStars(t);
    drawPixelText('PIXEL MARX', WIDTH / 2, 148, 48, '#facc15', 'center');
    drawPixelText('DẤU CHÂN TRIẾT GIA', WIDTH / 2, 206, 26, '#5eead4', 'center');
    drawPixelText('Sinh viên FPT ngủ gục trên bàn phím và bị hút vào Aletheia.', WIDTH / 2, 274, 18, '#dbeafe', 'center');
    drawPixelText('Nhấn ENTER hoặc nút Bắt đầu deadline', WIDTH / 2, 328, 20, '#fb7185', 'center');
    drawPixelText('WASD/Arrow • J đánh • K kỹ năng triết học • E tương tác', WIDTH / 2, 382, 16, '#c4b5fd', 'center');
    drawStudent(440, 420, 1, '#5eead4');
    drawBook(500, 446, '#facc15');
  }

  function drawPlaying() {
    const scene = state.scene;
    const chapter = chapters[state.chapterIndex];
    const shakeX = !isLowGraphics() && state.shake > 0 ? (Math.random() - 0.5) * 9 : 0;
    const shakeY = !isLowGraphics() && state.shake > 0 ? (Math.random() - 0.5) * 7 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawGradient(...chapter.colors);
    drawDecorGrid(chapter.colors[2]);
    drawPlatforms(scene);
    chapter.draw(scene);
    drawPortal(scene.portal);
    drawPickups(scene);
    drawCores(scene);
    drawSwitches(scene);
    drawGates(scene);
    drawMachines(scene);
    drawEnemies(scene);
    drawBosses(scene);
    drawProjectiles(scene);
    drawSlashes(scene);
    drawPlayer();
    drawEffects(scene);
    drawTopText(scene, chapter);
    ctx.restore();
  }

  function updateEnding(dt) {
    state.endingTimer += dt;
    if (consume(['KeyE', 'Enter', 'Space'])) {
      state.endingStep += 1;
      state.endingTimer = 0;
      if (state.endingStep >= endingSteps.length) {
        state.mode = 'menu';
        updateHUD();
      }
    }
  }

  function drawEnding() {
    const step = endingSteps[state.endingStep] || endingSteps[endingSteps.length - 1];
    drawGradient(step.color, '#0f172a', '#111827');
    const pulse = 0.5 + Math.sin(state.endingTimer * 3) * 0.5;
    drawPixelText(step.title, WIDTH / 2, 120, 28, '#facc15', 'center');
    wrapText(step.text, WIDTH / 2, 206, 720, 26, '#e0f2fe', 'center');

    if (state.endingStep === 0) {
      drawStudent(430, 360, 1, '#60a5fa');
      drawBook(500, 386, '#f97316');
      drawPixelText('MLN111', 520, 380, 13, '#111827', 'center');
    } else if (state.endingStep === 1) {
      drawFormulaBox('Lượng → Điểm Nút → Chất', 250, 344, '#5eead4');
      drawFormulaBox('Hạ tầng → Thượng tầng', 520, 344, '#f472b6');
    } else if (state.endingStep === 2) {
      drawStudent(430, 350, 1, '#86efac');
      drawPixelText('PHÒNG THI', 560, 392, 22, '#facc15', 'center');
    } else {
      drawPixelText(`Final Score: ${state.score}`, WIDTH / 2, 340, 28, '#86efac', 'center');
      drawPixelText('Nhấn E để về menu', WIDTH / 2, 404, 18 + pulse * 2, '#c4b5fd', 'center');
    }

    drawPixelText('Nhấn E / Enter để tiếp tục', WIDTH / 2, 490, 16, '#94a3b8', 'center');
  }

  function drawGradient(a, b, c) {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, a);
    gradient.addColorStop(0.55, b);
    gradient.addColorStop(1, c);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (!isLowGraphics()) {
      const bgName = state.mode === 'menu' || state.mode === 'ending' ? 'bgStars' : chapterBackgroundName();
      const backgroundFill = getBackgroundFill(bgName);
      if (backgroundFill) ctx.drawImage(backgroundFill, 0, 0, WIDTH, HEIGHT);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = a;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }
  }

  function drawStars(t) {
    const count = isLowGraphics() ? 24 : 80;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < count; i += 1) {
      const x = (i * 127 + (isLowGraphics() ? 0 : Math.sin(t + i) * 8)) % WIDTH;
      const y = (i * 71) % 420;
      ctx.fillRect(x, y, i % 3 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
    }
  }

  function drawDecorGrid(color) {
    if (isLowGraphics()) return;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 12; y < HEIGHT; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlatforms(scene) {
    for (const platform of scene.platforms) {
      const texture = platform.texture || chapterTextureName();
      drawTiledAsset(texture, platform.x, platform.y, platform.w, platform.h, 36, platform.color, () => {
        ctx.fillStyle = platform.color || '#172554';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      });
      if (!isLowGraphics()) {
        ctx.fillStyle = platform.top || '#38bdf8';
        ctx.fillRect(platform.x, platform.y, platform.w, 5);
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ffffff';
        for (let x = platform.x; x < platform.x + platform.w; x += 36) {
          ctx.fillRect(x + 5, platform.y + 13, 13, 5);
        }
        ctx.restore();
      }
    }
  }

  function drawPlayer() {
    const blink = player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0;
    if (blink) return;
    const aura = player.leapTime > 0 ? '#facc15' : player.inheritTime > 0 ? '#c4b5fd' : player.toolTime > 0 ? '#5eead4' : null;
    if (aura) {
      ctx.fillStyle = aura;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(player.x - 8, player.y - 8, player.w + 16, player.h + 16);
      ctx.globalAlpha = 1;
    }
    drawStudent(player.x, player.y, player.facing, aura || '#60a5fa');
    drawEquippedSword(aura || '#5eead4');
  }

  function drawEquippedSword(color) {
    const facing = player.facing >= 0 ? 1 : -1;
    const progress = player.attackAnim > 0 ? 1 - clamp(player.attackAnim / player.attackAnimMax, 0, 1) : 0;
    const handX = player.x + (facing > 0 ? player.w + 2 : -2);
    const handY = player.y + 29;
    const idleAngle = -0.68;
    const attackAngle = player.attackAnim > 0 ? -0.68 + easeOutSlash(progress) * 1.55 : idleAngle;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.scale(facing, 1);

    if (player.attackAnim > 0 && !isLowGraphics()) {
      drawSwordAfterimage(color, attackAngle - 0.34, 0.22);
      drawSwordAfterimage('#f8fafc', attackAngle - 0.18, 0.3);
    }

    ctx.rotate(attackAngle);
    drawHeldSwordSprite(color, player.attackAnim > 0 ? 1 : 0.88);
    ctx.restore();
  }

  function easeOutSlash(value) {
    return 1 - Math.pow(1 - clamp(value, 0, 1), 2.4);
  }

  function drawSwordAfterimage(color, angle, alpha) {
    ctx.save();
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    drawSwordBladeOnly(color);
    ctx.restore();
  }

  function drawHeldSwordSprite(color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    drawSwordBladeOnly('#242534');
    ctx.fillStyle = '#242534';
    ctx.fillRect(-8, -7, 6, 14);
    ctx.fillRect(-23, -2, 16, 4);
    ctx.fillStyle = '#4a5066';
    ctx.fillRect(-10, -10, 8, 20);
    ctx.fillRect(-27, -3, 19, 5);
    ctx.fillStyle = '#6b7285';
    ctx.fillRect(-8, -7, 4, 15);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-24, -2, 14, 3);
    if (!isLowGraphics()) {
      ctx.fillStyle = color;
      ctx.globalAlpha *= 0.3;
      ctx.fillRect(4, -5, 22, 1);
    }
    ctx.restore();
  }

  function drawSwordBladeOnly(color) {
    ctx.fillStyle = color;
    ctx.fillRect(-1, -5, 45, 10);
    ctx.fillRect(43, -3, 8, 6);
    ctx.fillRect(51, -1, 3, 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(1, -3, 45, 6);
    ctx.fillRect(46, -1, 7, 2);
    ctx.fillStyle = '#dbe4f0';
    ctx.fillRect(6, -1, 38, 2);
  }

  function drawStudent(x, y, facing, shirt) {
    const fallback = () => {
      const flipOffset = facing < 0 ? -2 : 2;
      ctx.fillStyle = '#f7c59f';
      ctx.fillRect(x + 9, y + 2, 16, 16);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 7, y, 20, 7);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x + 13 + flipOffset, y + 8, 4, 4);
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 6, y + 20, 22, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 10, y + 40, 7, 14);
      ctx.fillRect(x + 20, y + 40, 7, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + (facing > 0 ? 27 : -8), y + 23, 10, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + (facing > 0 ? 35 : -17), y + 20, 14, 10);
    };

    const image = assetImage(player.leapTime > 0 ? 'playerAlt' : 'player');
    if (!image) {
      fallback();
      return;
    }

    ctx.save();
    if (facing < 0) {
      ctx.translate(x + player.w, y - 2);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, player.w + 6, player.h + 6);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = shirt;
      ctx.fillRect(0, 18, player.w + 6, 22);
    } else {
      ctx.drawImage(image, x - 2, y - 2, player.w + 6, player.h + 6);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = shirt;
      ctx.fillRect(x - 2, y + 18, player.w + 6, 22);
    }
    ctx.restore();
  }

  function drawBook(x, y, color) {
    drawTintedAsset('book', x, y, 48, 30, color, 0.38, () => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 48, 30);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 4, y + 5, 40, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 23, y + 4, 2, 22);
    });
  }

  function drawPickups(scene) {
    for (const pickup of scene.pickups) {
      if (pickup.taken) continue;
      const bob = isLowGraphics() ? 0 : Math.sin(pickup.bob || 0) * 4;
      if (pickup.kind === 'ore') {
        drawTintedAsset('ore', pickup.x - 3, pickup.y + bob - 3, pickup.w + 6, pickup.h + 6, '#facc15', 0.24, () => {
          drawDiamond(pickup.x, pickup.y + bob, pickup.w, pickup.h, '#facc15', '#92400e');
        });
      } else if (pickup.kind === 'heart') {
        drawTintedAsset('heart', pickup.x, pickup.y + bob, pickup.w, pickup.h, '#fb7185', 0.34, () => {
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(pickup.x + 4, pickup.y + bob + 4, 10, 10);
          ctx.fillRect(pickup.x + 16, pickup.y + bob + 4, 10, 10);
          ctx.fillRect(pickup.x + 8, pickup.y + bob + 14, 16, 12);
        });
      } else if (pickup.kind === 'blueprint') {
        drawTintedAsset('book', pickup.x, pickup.y + bob, pickup.w, pickup.h, '#38bdf8', 0.35, () => {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pickup.x, pickup.y + bob, pickup.w, pickup.h);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pickup.x + 6, pickup.y + bob + 6, pickup.w - 12, 4);
          ctx.fillRect(pickup.x + 6, pickup.y + bob + 16, pickup.w - 16, 4);
        });
      }
    }
  }

  function drawDiamond(x, y, w, h, color, outline) {
    ctx.fillStyle = outline;
    ctx.fillRect(x + w / 2 - 4, y - 2, 8, 4);
    ctx.fillRect(x - 2, y + h / 2 - 4, 4, 8);
    ctx.fillRect(x + w - 2, y + h / 2 - 4, 4, 8);
    ctx.fillRect(x + w / 2 - 4, y + h - 2, 8, 4);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawCores(scene) {
    for (const core of scene.cores) {
      if (core.dead) continue;
      if (core.hidden && !core.revealed) {
        ctx.globalAlpha = 0.18;
      }
      drawTintedAsset('ore', core.x, core.y, core.w, core.h, core.revealed ? '#5eead4' : '#312e81', 0.42, () => {
        ctx.fillStyle = core.revealed ? '#5eead4' : '#312e81';
        ctx.fillRect(core.x, core.y, core.w, core.h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(core.x + 8, core.y + 8, core.w - 16, core.h - 16);
      });
      ctx.strokeStyle = core.revealed ? '#facc15' : '#6366f1';
      ctx.lineWidth = 3;
      ctx.strokeRect(core.x - 2, core.y - 2, core.w + 4, core.h + 4);
      ctx.globalAlpha = 1;
    }
  }

  function drawSwitches(scene) {
    for (const sw of scene.switches) {
      const color = sw.element === 'fire' ? '#fb7185' : '#60a5fa';
      drawTintedAsset('switchTile', sw.x, sw.y, sw.w, sw.h, sw.active ? '#86efac' : '#334155', 0.44, () => {
        ctx.fillStyle = sw.active ? '#86efac' : '#334155';
        ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      });
      ctx.fillStyle = color;
      ctx.fillRect(sw.x + 7, sw.y - 18, sw.w - 14, 18);
      ctx.strokeStyle = sw.active ? '#bbf7d0' : color;
      ctx.lineWidth = 3;
      ctx.strokeRect(sw.x - 2, sw.y - 2, sw.w + 4, sw.h + 4);
      drawPixelText(sw.element === 'fire' ? 'LỬA' : 'BĂNG', sw.x + sw.w / 2, sw.y + sw.h + 18, 12, '#e0f2fe', 'center');
    }
  }

  function drawGates(scene) {
    for (const gate of scene.gates) {
      if (gate.open || gate.dead) continue;
      drawTintedAsset('gate', gate.x, gate.y, gate.w, gate.h, gate.color || '#64748b', 0.5, () => {
        ctx.fillStyle = gate.color || '#64748b';
        ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
        ctx.fillStyle = '#0f172a';
        for (let y = gate.y + 8; y < gate.y + gate.h; y += 18) {
          ctx.fillRect(gate.x + 5, y, gate.w - 10, 5);
        }
      });
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(gate.x - 2, gate.y - 2, gate.w + 4, gate.h + 4);
      drawPixelText(gate.label || 'CỔNG CŨ', gate.x + gate.w / 2, gate.y - 10, 12, '#f8fafc', 'center');
    }
  }

  function drawMachines(scene) {
    for (const machine of scene.machines) {
      if (machine.dead) continue;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(machine.x - 3, machine.y - 3, machine.w + 6, machine.h + 6);
      drawTintedAsset('machine', machine.x, machine.y, machine.w, machine.h, machine.color || '#22d3ee', 0.42, () => {
        ctx.fillStyle = machine.color || '#22d3ee';
        ctx.fillRect(machine.x, machine.y, machine.w, machine.h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(machine.x + 8, machine.y + 8, machine.w - 16, 8);
        ctx.fillStyle = '#111827';
        ctx.fillRect(machine.x + 10, machine.y + 24, machine.w - 20, 12);
      });
      drawHealthBar(machine, machine.x, machine.y - 10, machine.w, 5);
    }
  }

  function drawEnemies(scene) {
    for (const enemy of scene.enemies) {
      if (enemy.dead) continue;
      if (enemy.hidden && !enemy.revealed) {
        ctx.globalAlpha = 0.14;
      }
      drawEnemyBlock(enemy, enemy.color || '#a78bfa');
      ctx.globalAlpha = 1;
    }
  }

  function drawEnemyBlock(enemy, color) {
    const flashColor = enemy.flash > 0 ? '#fef2f2' : color;
    drawTintedAsset(enemyAssetName(enemy), enemy.x, enemy.y, enemy.w, enemy.h, flashColor, 0.36, () => {
      ctx.fillStyle = flashColor;
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(enemy.x + 7, enemy.y + 8, 7, 7);
      ctx.fillRect(enemy.x + enemy.w - 14, enemy.y + 8, 7, 7);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(enemy.x + 8, enemy.y + enemy.h - 10, enemy.w - 16, 4);
    });
    drawHealthBar(enemy, enemy.x, enemy.y - 10, enemy.w, 5);
  }

  function drawBosses(scene) {
    for (const boss of scene.bosses) {
      if (boss.dead && boss.kind !== 'twin') continue;
      if (boss.kind === 'twin') {
        drawTwinBoss(boss);
      } else {
        drawBossBlock(boss);
      }
    }
  }

  function drawBossBlock(boss) {
    const flashColor = boss.flash > 0 ? '#fef2f2' : boss.color || '#fb7185';
    drawTintedAsset('boss', boss.x, boss.y, boss.w, boss.h, flashColor, 0.4, () => {
      ctx.fillStyle = flashColor;
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(boss.x + 12, boss.y + 18, 12, 12);
      ctx.fillRect(boss.x + boss.w - 24, boss.y + 18, 12, 12);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(boss.x + 14, boss.y + boss.h - 20, boss.w - 28, 7);
    });
    if (boss.shield) {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 5;
      ctx.strokeRect(boss.x - 8, boss.y - 8, boss.w + 16, boss.h + 16);
    }
    drawHealthBar(boss, boss.x, boss.y - 16, boss.w, 7);
    drawPixelText(boss.name, boss.x + boss.w / 2, boss.y - 28, 12, '#f8fafc', 'center');
  }

  function drawTwinBoss(boss) {
    if (!boss.fireDead) {
      drawEnemyBlock({ ...boss.fire, hp: boss.fireHp, maxHp: boss.maxHp, name: 'Mặt Lửa', asset: 'enemyFire' }, '#ef4444');
    }
    if (!boss.iceDead) {
      drawEnemyBlock({ ...boss.ice, hp: boss.iceHp, maxHp: boss.maxHp, name: 'Mặt Băng', asset: 'enemyIce' }, '#38bdf8');
    }
    drawPixelText('Song Sinh Thái Cực', 700, 300, 13, '#f8fafc', 'center');
  }

  function drawHealthBar(actor, x, y, w, h) {
    if (!actor.maxHp) return;
    ctx.fillStyle = '#111827';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(x, y, w * clamp(actor.hp / actor.maxHp, 0, 1), h);
  }

  function drawProjectiles(scene) {
    for (const p of scene.projectiles) {
      const color = p.color || '#facc15';
      drawTintedAsset(p.element === 'ice' ? 'enemyIce' : p.element === 'fire' ? 'enemyFire' : 'ore', p.x, p.y, p.w, p.h, color, 0.44, () => {
        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        if (p.element) {
          ctx.fillStyle = p.element === 'fire' ? '#fed7aa' : '#dbeafe';
          ctx.fillRect(p.x + 3, p.y + 3, Math.max(2, p.w - 6), Math.max(2, p.h - 6));
        }
      });
    }
  }

  function createMeleeSlash(attackBox, facing, color) {
    return {
      ...attackBox,
      facing,
      color,
      ttl: 0.16,
      maxTtl: 0.16,
      kind: 'melee',
    };
  }

  function drawSlashes(scene) {
    for (const slash of scene.slashes) {
      if (slash.kind === 'melee') {
        drawMeleeSlash(slash);
        continue;
      }
      if (isLowGraphics() && slash.ttl < 0.05) continue;
      ctx.globalAlpha = isLowGraphics() ? 0.7 : Math.max(0.25, slash.ttl * 8);
      ctx.fillStyle = slash.color;
      ctx.fillRect(slash.x, slash.y, slash.w, slash.h);
      ctx.globalAlpha = 1;
    }
  }

  function drawMeleeSlash(slash) {
    const progress = 1 - clamp(slash.ttl / slash.maxTtl, 0, 1);
    const facing = slash.facing >= 0 ? 1 : -1;
    const low = isLowGraphics();
    const originX = facing > 0 ? slash.x + 4 : slash.x + slash.w - 4;
    const originY = slash.y + slash.h / 2 + 8;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(facing, 1);

    if (progress < 0.25) {
      drawSwordSwingFrame(slash.color, 'anticipation', progress / 0.25, low);
    } else if (progress < 0.68) {
      drawSwordSwingFrame(slash.color, 'strike', (progress - 0.25) / 0.43, low);
    } else {
      drawSwordSwingFrame(slash.color, 'recovery', (progress - 0.68) / 0.32, low);
    }

    ctx.restore();
  }

  function drawSwordSwingFrame(color, stage, frame, low) {
    if (stage === 'anticipation') {
      ctx.save();
      ctx.translate(10 + frame * 2, -2 + frame * 3);
      ctx.rotate(-0.72 + frame * 0.18);
      drawSwordSprite(color, 0.78, 0.78, low, 0.7, true);
      if (!low) drawSwordTrail(color, 0.34, -10, -6, 20, 4, 0.3);
      ctx.restore();
      return;
    }

    if (stage === 'strike') {
      const sweep = -0.08 + frame * 0.95;
      const slide = frame * 14;
      ctx.save();
      ctx.translate(12 + slide, -10 + frame * 5);
      ctx.rotate(sweep);
      drawSwordSprite('rgba(15,23,42,0.72)', 1.02, 1.02, low, 0.9, true);
      drawSwordSprite(color, 0.98, 0.98, low, 1, false);
      drawSwordSprite('#f8fafc', 0.7, 0.7, low, 0.85, false);
      if (!low) {
        drawSwordTrail(color, 0.42, -8, -4, 30, 6, 0.32);
        drawSwordTrail('#e0f2fe', 0.22, 6, 0, 18, 4, 0.22);
      }
      ctx.restore();
      return;
    }

    const alpha = 0.72 * (1 - frame);
    if (alpha <= 0.03) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(18 + frame * 10, -5 + frame * 4);
    ctx.rotate(0.28 + frame * 0.12);
    drawSwordSprite(color, 0.82, 0.82, low, 0.82, false);
    drawSwordSprite('#f8fafc', 0.58, 0.58, low, 0.62, false);
    if (!low) drawSwordTrail(color, 0.18, -6, -2, 18, 3, alpha * 0.5);
    ctx.restore();
  }

  function drawSwordSprite(color, scaleX, scaleY, low, alpha = 1, outline = false) {
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha *= alpha;
    if (outline) {
      ctx.fillStyle = 'rgba(36,37,52,0.98)';
      ctx.fillRect(-3, -2, 44, 6);
      ctx.fillRect(6, -6, 8, 16);
      ctx.fillRect(18, -2, 4, 8);
    }
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 34, 4);
    ctx.fillRect(1, 1, 32, 2);
    ctx.fillStyle = '#dbe4f0';
    ctx.fillRect(6, 1, 22, 1);
    if (!low) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 4, 4, 2);
      ctx.fillRect(28, 3, 5, 1);
    }
    ctx.fillStyle = '#3f3f5f';
    ctx.fillRect(15, -2, 4, 8);
    ctx.fillRect(17, -6, 2, 14);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(14, 4, 6, 2);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(10, 5, 11, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 15, 3);
    ctx.restore();
  }

  function drawSwordTrail(color, alpha, x, y, w, h, stretch) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.round(w * stretch), h);
    ctx.fillRect(x + 4, y + 1, Math.round(w * 0.65 * stretch), Math.max(2, h - 1));
    ctx.restore();
  }

  function drawEffects(scene) {
    if (isLowGraphics()) {
      for (let i = 0; i < scene.effects.length; i += 2) {
        const effect = scene.effects[i];
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = effect.color;
        ctx.fillRect(effect.x, effect.y, effect.w, effect.h);
        ctx.globalAlpha = 1;
      }
      return;
    }
    for (const effect of scene.effects) {
      ctx.globalAlpha = clamp(effect.ttl / effect.maxTtl, 0, 1);
      ctx.fillStyle = effect.color;
      ctx.fillRect(effect.x, effect.y, effect.w, effect.h);
      ctx.globalAlpha = 1;
    }
  }

  function drawPortal(portal) {
    if (!portal) return;
    const pulse = isLowGraphics() ? 0.72 : 0.65 + Math.sin(performance.now() / 140) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    drawTintedAsset('portal', portal.x, portal.y, portal.w, portal.h, '#5eead4', 0.48, () => {
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(portal.x + 10, portal.y + 10, portal.w - 20, portal.h - 20);
    });
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(portal.x - 4, portal.y - 4, portal.w + 8, portal.h + 8);
    ctx.restore();
    drawPixelText('E', portal.x + portal.w / 2, portal.y - 12, 16, '#facc15', 'center');
  }

  function drawTopText(scene, chapter) {
    const bodyText = scene.complete ? scene.completeReason : chapter.objective;
    const bodyLines = splitPixelText(bodyText, 12, WIDTH - 56);
    const boxHeight = 50 + bodyLines.length * 17;
    ctx.fillStyle = 'rgba(8,13,28,0.72)';
    ctx.fillRect(14, 14, WIDTH - 28, boxHeight);
    drawPixelText(chapter.title, 28, 38, 16, '#facc15', 'left');
    drawPixelWrappedText(bodyLines, 28, 65, 17, 12, '#e0f2fe', 'left');
  }

  function drawPixelText(text, x, y, size, color, align = 'left') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if (!isLowGraphics()) {
      ctx.shadowColor = '#020617';
      ctx.shadowOffsetX = Math.max(2, Math.floor(size / 7));
      ctx.shadowOffsetY = Math.max(2, Math.floor(size / 7));
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  }


  function splitPixelText(text, size, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    ctx.save();
    ctx.font = `bold ${size}px "Courier New", monospace`;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  function drawPixelWrappedText(lines, x, y, lineHeight, size, color, align = 'left') {
    lines.forEach((line, index) => drawPixelText(line, x, y + index * lineHeight, size, color, align));
  }

  function wrapText(text, x, y, maxWidth, lineHeight, color, align = 'left') {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    ctx.font = `bold 20px "Courier New", monospace`;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.forEach((entry, index) => drawPixelText(entry, x, y + index * lineHeight, 20, color, align));
  }

  function drawFormulaBox(text, x, y, color) {
    ctx.fillStyle = 'rgba(2,6,23,0.82)';
    ctx.fillRect(x, y, 220, 76);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 220, 76);
    wrapText(text, x + 110, y + 30, 190, 22, color, 'center');
  }

  // Chapter 1: matter and consciousness.
  function setupChapter1(scene) {
    scene.local.scanCooldown = 0;
    scene.local.scanTime = 0;
    scene.local.coresDestroyed = 0;
    scene.cores.push(
      { name: 'Khối Vật Chất A', x: 248, y: GROUND_Y - 46, w: 38, h: 38, hp: 20, maxHp: 20, hidden: true, revealed: false, score: 70 },
      { name: 'Khối Vật Chất B', x: 612, y: GROUND_Y - 46, w: 38, h: 38, hp: 20, maxHp: 20, hidden: true, revealed: false, score: 70 },
    );
    scene.enemies.push(
      { name: 'Ảo ảnh giáo điều', x: 340, y: GROUND_Y - 42, w: 38, h: 42, hp: 22, maxHp: 22, vx: 50, minX: 310, maxX: 460, hidden: true, revealed: false, color: '#8b5cf6', damage: 9, score: 40 },
      { name: 'Phức hợp cảm giác', x: 520, y: GROUND_Y - 42, w: 38, h: 42, hp: 22, maxHp: 22, vx: -45, minX: 480, maxX: 650, hidden: true, revealed: false, color: '#a78bfa', damage: 9, score: 40 },
    );
    scene.bosses.push({ name: 'Đại Ma Vương Berkeley', x: 792, y: GROUND_Y - 92, w: 78, h: 92, hp: 95, maxHp: 95, shield: true, color: '#7c3aed', damage: 13, score: 180 });
    scene.pickups.push({ kind: 'heart', x: 148, y: GROUND_Y - 28, w: 30, h: 28, score: 5 });
  }

  function skillChapter1(scene) {
    if (scene.local.scanCooldown > 0) {
      quickMessage('Máy quét đang hồi chiêu. Thực tại khách quan không chạy đi đâu cả, bình tĩnh!', 'Mác-bro');
      return;
    }
    scene.local.scanTime = 5;
    scene.local.scanCooldown = 7;
    for (const item of [...scene.cores, ...scene.enemies]) item.revealed = true;
    quickMessage('RÀ QUÉT THỰC TẠI: các Khối Vật Chất đã hiện hình!', 'Kỹ năng');
  }

  function attackChapter1(scene, attackBox) {
    let hit = false;
    for (const core of scene.cores) {
      if (!core.dead && overlap(attackBox, core)) {
        if (!core.revealed) {
          quickMessage('Đập vào ảo ảnh không ăn thua. Dùng K để tìm vật chất trước!', 'Berkeley');
          continue;
        }
        hit = true;
        hitActor(core, 12, `${core.name} vỡ ra: ảo ảnh mất nền tảng.`);
      }
    }

    for (const enemy of scene.enemies) {
      if (!enemy.dead && overlap(attackBox, enemy)) {
        if (enemy.hidden && !enemy.revealed) {
          quickMessage('Không thể đánh thứ chỉ “tồn tại trong tri giác”. Hãy rà quét!', 'Berkeley');
          continue;
        }
        hit = true;
        hitActor(enemy, 14, `${enemy.name} tan biến.`);
      }
    }

    const boss = scene.bosses[0];
    if (boss && !boss.dead && overlap(attackBox, boss)) {
      if (boss.shield) {
        quickMessage('Berkeley còn giáp “Tồn tại tức là được tri giác”. Phá lõi vật chất trước!', 'Berkeley');
      } else {
        hit = true;
        hitActor(boss, 13, 'Berkeley thất bại: ý thức không thể thay thế thực tại khách quan độc lập với cảm giác.');
      }
    }
    if (hit && !isLowGraphics()) state.shake = Math.max(state.shake, 0.08);
  }

  function updateChapter1(scene, dt) {
    scene.local.scanCooldown = Math.max(0, scene.local.scanCooldown - dt);
    scene.local.scanTime = Math.max(0, scene.local.scanTime - dt);
    if (scene.local.scanTime <= 0) {
      for (const item of [...scene.cores, ...scene.enemies]) {
        if (!item.dead) item.revealed = false;
      }
    }
    const destroyed = scene.cores.filter((core) => core.dead).length;
    if (destroyed !== scene.local.coresDestroyed) {
      scene.local.coresDestroyed = destroyed;
      for (const enemy of scene.enemies) enemy.revealed = true;
    }
    const boss = scene.bosses[0];
    if (boss && destroyed >= scene.cores.length) {
      boss.shield = false;
      for (const enemy of scene.enemies) enemy.hidden = false;
    }
    if (boss && boss.dead) markComplete('Đã chứng minh vật chất là thực tại khách quan.');
  }

  function drawChapter1(scene) {
    const t = performance.now() / 1000;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#c084fc';
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(120 + i * 110, 110 + Math.sin(t + i) * 18, 54, 9);
    }
    ctx.globalAlpha = 1;
    if (scene.local.scanTime > 0) {
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 4;
      ctx.strokeRect(player.x - 86, player.y - 86, player.w + 172, player.h + 172);
      drawPixelText('RÀ QUÉT THỰC TẠI', player.x + player.w / 2, player.y - 30, 13, '#5eead4', 'center');
    }
  }

  // Chapter 2: quantity-quality.
  function setupChapter2(scene) {
    scene.local.degree = 0;
    for (let i = 0; i < 8; i += 1) {
      scene.pickups.push({ kind: 'ore', x: 130 + i * 82, y: GROUND_Y - 26, w: 24, h: 24, value: i % 2 === 0 ? 15 : 12, score: 20 });
    }
    scene.enemies.push(
      { name: 'Quái bọc thép', x: 324, y: GROUND_Y - 44, w: 42, h: 44, hp: 28, maxHp: 28, vx: 35, minX: 300, maxX: 470, color: '#78716c', damage: 10, armored: true, score: 60 },
      { name: 'Thợ mỏ trì trệ', x: 528, y: GROUND_Y - 44, w: 42, h: 44, hp: 28, maxHp: 28, vx: -38, minX: 500, maxX: 670, color: '#92400e', damage: 10, armored: true, score: 60 },
    );
    scene.bosses.push({ name: 'Golem Bảo Thủ', x: 775, y: GROUND_Y - 108, w: 94, h: 108, hp: 120, maxHp: 120, shield: true, color: '#57534e', damage: 15, score: 220 });
  }

  function skillChapter2(scene) {
    if (scene.local.degree >= 100) {
      player.leapTime = 10;
      scene.local.degree = 0;
      quickMessage('BƯỚC NHẢY! Lượng đã đạt Điểm Nút, chất mới xuất hiện trong 10 giây.', 'Quy luật Lượng - Chất');
    } else {
      damagePlayer(12, 'Nôn nóng tả khuynh: chưa đủ lượng mà đòi nhảy chất!');
      scene.local.degree = Math.max(0, scene.local.degree - 10);
    }
  }

  function attackChapter2(scene, attackBox) {
    const empowered = player.leapTime > 0;
    for (const enemy of scene.enemies) {
      if (!enemy.dead && overlap(attackBox, enemy)) {
        if (!empowered && enemy.armored) {
          quickMessage('Đòn thường = 0 sát thương. Hãy tích lũy Lượng tới 100%!', 'Golem');
        } else {
          hitActor(enemy, empowered ? 24 : 8, `${enemy.name} bị phá giáp bởi bước nhảy.`);
        }
      }
    }
    const boss = scene.bosses[0];
    if (boss && !boss.dead && overlap(attackBox, boss)) {
      if (!empowered) {
        quickMessage('Golem Bảo Thủ miễn nhiễm khi chưa có Bước Nhảy.', 'Golem Bảo Thủ');
      } else {
        boss.shield = false;
        hitActor(boss, 26, 'Golem Bảo Thủ tan rã: tích lũy đủ lượng đã đổi chất.');
      }
    }
  }

  function updateChapter2(scene) {
    const boss = scene.bosses[0];
    if (boss && player.leapTime <= 0 && !boss.dead) boss.shield = true;
    if (boss && boss.dead) markComplete('Đã thực hiện Bước Nhảy qua Điểm Nút.');
  }

  function drawChapter2(scene) {
    ctx.fillStyle = 'rgba(250,204,21,0.16)';
    ctx.fillRect(58, 96, 86, 260);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 96, 86, 260);
    ctx.fillStyle = '#f59e0b';
    const fill = 260 * (scene.local.degree / 100);
    ctx.fillRect(58, 356 - fill, 86, fill);
    drawPixelText('BÌNH ĐỘ', 101, 78, 14, '#fef3c7', 'center');
    drawPixelText(`${scene.local.degree}%`, 101, 386, 16, '#fef3c7', 'center');
    if (player.leapTime > 0) {
      drawPixelText(`BƯỚC NHẢY: ${player.leapTime.toFixed(1)}s`, WIDTH / 2, 112, 18, '#facc15', 'center');
    }
  }

  // Chapter 3: contradiction.
  function setupChapter3(scene) {
    scene.local.contradiction = 0;
    scene.local.projectileTimer = 1;
    scene.local.reviveTimer = 0;
    scene.switches.push(
      { element: 'fire', x: 212, y: GROUND_Y - 42, w: 42, h: 42, active: false },
      { element: 'ice', x: 362, y: GROUND_Y - 42, w: 42, h: 42, active: false },
    );
    scene.gates.push({ x: 475, y: GROUND_Y - 112, w: 42, h: 112, open: false, label: 'CỔNG ĐỐI LẬP', color: '#334155' });
    scene.enemies.push(
      { name: 'Mầm Lửa', x: 560, y: GROUND_Y - 38, w: 36, h: 38, hp: 24, maxHp: 24, vx: 36, minX: 535, maxX: 650, color: '#ef4444', damage: 9, score: 45 },
      { name: 'Mầm Băng', x: 662, y: GROUND_Y - 38, w: 36, h: 38, hp: 24, maxHp: 24, vx: -36, minX: 620, maxX: 740, color: '#38bdf8', damage: 9, score: 45 },
    );
    scene.bosses.push({
      kind: 'twin',
      name: 'Song Sinh Thái Cực',
      maxHp: 72,
      fireHp: 72,
      iceHp: 72,
      fireDead: false,
      iceDead: false,
      fire: { x: 700, y: GROUND_Y - 82, w: 56, h: 82 },
      ice: { x: 800, y: GROUND_Y - 82, w: 56, h: 82 },
      score: 260,
    });
  }

  function skillChapter3(scene) {
    const twin = scene.bosses[0];
    if (!scene.gates[0].open) {
      quickMessage('Chưa đủ hai mặt đối lập. Hãy bật cả Lửa và Băng trước!', 'Lênin-senpai');
      return;
    }
    if (scene.local.contradiction < 50) {
      quickMessage('Mâu thuẫn chưa đủ chín muồi. Dụ đòn đối lập va vào nhau hoặc đánh xen kẽ để tích lũy.', 'Rừng lưỡng cực');
      return;
    }
    if (!twin.fireDead) twin.fireHp = Math.max(0, twin.fireHp - 18);
    if (!twin.iceDead) twin.iceHp = Math.max(0, twin.iceHp - 18);
    const avg = (Math.max(0, twin.fireHp) + Math.max(0, twin.iceHp)) / 2;
    twin.fireHp = twin.fireDead ? twin.fireHp : avg;
    twin.iceHp = twin.iceDead ? twin.iceHp : avg;
    scene.local.contradiction = 0;
    quickMessage('Cân bằng mâu thuẫn: hai mặt đối lập bị kéo về cùng điểm nút giải quyết.', 'Kỹ năng');
  }

  function attackChapter3(scene, attackBox) {
    for (const sw of scene.switches) {
      if (!sw.active && overlap(attackBox, sw)) {
        sw.active = true;
        scene.local.contradiction = clamp(scene.local.contradiction + 25, 0, 100);
        quickMessage(`Đã kích hoạt ${sw.element === 'fire' ? 'Lửa' : 'Băng'}.`, 'Công tắc');
      }
    }
    for (const enemy of scene.enemies) {
      if (!enemy.dead && overlap(attackBox, enemy)) hitActor(enemy, 12, `${enemy.name} bị giải quyết.`);
    }
    const twin = scene.bosses[0];
    if (!scene.gates[0].open) return;
    if (!twin.fireDead && overlap(attackBox, twin.fire)) {
      twin.fireHp = Math.max(0, twin.fireHp - 11);
      scene.local.contradiction = clamp(scene.local.contradiction + 10, 0, 100);
    }
    if (!twin.iceDead && overlap(attackBox, twin.ice)) {
      twin.iceHp = Math.max(0, twin.iceHp - 11);
      scene.local.contradiction = clamp(scene.local.contradiction + 10, 0, 100);
    }
  }

  function updateChapter3(scene, dt) {
    const gate = scene.gates[0];
    if (!gate.open && scene.switches.every((sw) => sw.active)) {
      gate.open = true;
      quickMessage('Cổng mở: thống nhất của hai mặt đối lập đã xuất hiện.', 'Rừng lưỡng cực');
    }

    const twin = scene.bosses[0];
    if (!gate.open) return;

    scene.local.projectileTimer -= dt;
    if (scene.local.projectileTimer <= 0) {
      scene.local.projectileTimer = 1.6;
      if (!twin.fireDead) spawnTwinProjectile(scene, twin.fire, twin.ice, 'fire');
      if (!twin.iceDead) spawnTwinProjectile(scene, twin.ice, twin.fire, 'ice');
    }

    for (const p of scene.projectiles) {
      if (!p.element) continue;
      if (p.element === 'fire' && !twin.iceDead && overlap(p, twin.ice)) {
        p.ttl = 0;
        twin.iceHp = Math.max(0, twin.iceHp - 16);
        scene.local.contradiction = clamp(scene.local.contradiction + 25, 0, 100);
        quickMessage('Lửa đánh trúng Băng: đấu tranh nội tại làm mâu thuẫn phát triển!', 'Song Sinh');
      }
      if (p.element === 'ice' && !twin.fireDead && overlap(p, twin.fire)) {
        p.ttl = 0;
        twin.fireHp = Math.max(0, twin.fireHp - 16);
        scene.local.contradiction = clamp(scene.local.contradiction + 25, 0, 100);
        quickMessage('Băng đánh trúng Lửa: hai mặt đối lập tự phủ định nhau!', 'Song Sinh');
      }
    }

    twin.fireDead = twin.fireHp <= 0;
    twin.iceDead = twin.iceHp <= 0;

    if (twin.fireDead && twin.iceDead) {
      markComplete('Đã giải quyết mâu thuẫn trong tính chỉnh thể của hai mặt đối lập.');
      return;
    }

    if (twin.fireDead || twin.iceDead) {
      scene.local.reviveTimer += dt;
      if (scene.local.reviveTimer > 2.2) {
        if (twin.fireDead && !twin.iceDead) {
          twin.fireHp = 28;
          twin.fireDead = false;
          twin.iceHp = Math.max(8, twin.iceHp - 16);
          quickMessage('Mặt Băng phục hồi Mặt Lửa: các mặt đối lập nương tựa, làm tiền đề tồn tại cho nhau nên không thể xử lý phiến diện.', 'Song Sinh');
        } else if (twin.iceDead && !twin.fireDead) {
          twin.iceHp = 28;
          twin.iceDead = false;
          twin.fireHp = Math.max(8, twin.fireHp - 16);
          quickMessage('Mặt Lửa hồi sinh Mặt Băng: phải giải quyết mâu thuẫn toàn diện!', 'Song Sinh');
        }
        scene.local.reviveTimer = 0;
      }
    } else {
      scene.local.reviveTimer = 0;
    }
  }

  function spawnTwinProjectile(scene, from, target, element) {
    const source = centerOf(from);
    const aimTarget = Math.random() < 0.55 ? centerOf(playerRect()) : centerOf(target);
    const dx = aimTarget.x - source.x;
    const dy = aimTarget.y - source.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    scene.projectiles.push({
      x: source.x,
      y: source.y,
      w: 18,
      h: 18,
      vx: (dx / len) * 210,
      vy: (dy / len) * 210,
      ttl: 3.8,
      damage: 7,
      element,
      color: element === 'fire' ? '#ef4444' : '#38bdf8',
      message: element === 'fire' ? 'Lửa cực đoan thiêu cháy bạn!' : 'Băng bảo thủ đóng băng bạn!',
    });
  }

  function drawChapter3(scene) {
    const gate = scene.gates[0];
    if (gate.open) drawPixelText('CỔNG ĐỐI LẬP ĐÃ MỞ', 490, 332, 14, '#86efac', 'center');
    ctx.fillStyle = 'rgba(239,68,68,0.22)';
    ctx.fillRect(0, GROUND_Y - 170, WIDTH / 2, 170);
    ctx.fillStyle = 'rgba(56,189,248,0.22)';
    ctx.fillRect(WIDTH / 2, GROUND_Y - 170, WIDTH / 2, 170);
    drawPixelText(`Mâu thuẫn: ${Math.floor(scene.local.contradiction)}%`, WIDTH / 2, 112, 18, '#facc15', 'center');
  }

  // Chapter 4: negation of negation.
  function setupChapter4(scene) {
    scene.local.phase = 1;
    scene.local.inheritCharge = 0;
    scene.local.shotTimer = 1;
    scene.local.groundSpawnTimer = 60;
    scene.local.groundSpawnCount = 0;
    scene.platforms.push(
      { ...rect(176, 365, 176, 18), color: '#312e81', top: '#c4b5fd' },
      { ...rect(472, 292, 176, 18), color: '#312e81', top: '#c4b5fd' },
      { ...rect(286, 220, 176, 18), color: '#312e81', top: '#c4b5fd' },
    );
    scene.bosses.push({
      name: 'Phượng Hoàng Ouroboros',
      x: 748,
      y: 112,
      w: 92,
      h: 92,
      hp: 70,
      maxHp: 70,
      phase: 1,
      color: '#f97316',
      damage: 15,
      score: 300,
      vx: -92,
      vy: 38,
      minX: 118,
      maxX: WIDTH - 138,
      minY: 74,
      maxY: 205,
    });
    scene.pickups.push(
      { kind: 'heart', x: 410, y: 188, w: 30, h: 28, score: 5 },
      { kind: 'heart', x: 160, y: GROUND_Y - 30, w: 30, h: 28, score: 5 },
      { kind: 'heart', x: 760, y: GROUND_Y - 30, w: 30, h: 28, score: 5 },
    );
  }

  function skillChapter4(scene) {
    if (scene.local.inheritCharge < 100) {
      quickMessage('Chưa tích lũy đủ kinh nghiệm phủ định. Đánh boss để sạc Kế thừa.', 'Ouroboros');
      return;
    }
    player.inheritTime = 6;
    scene.local.inheritCharge = 0;
    quickMessage('Kế thừa sức mạnh: cái mới giữ lại hạt nhân hợp lý của cái cũ trong 6 giây.', 'Phủ định của phủ định');
  }

  function advanceOuroborosPhase(scene, boss) {
    if (boss.hp > 0) return;
    if (boss.phase >= 3) {
      boss.dead = true;
      return;
    }
    boss.phase += 1;
    scene.local.phase = boss.phase;
    boss.dead = false;
    boss.maxHp = 68 + boss.phase * 30;
    boss.hp = boss.maxHp;
    boss.color = boss.phase === 2 ? '#a855f7' : '#facc15';
    boss.vx *= 1.12;
    boss.vy *= -1.08;
    state.shake = 0.35;
    quickMessage(`Phủ định lần ${boss.phase - 1}! Boss trở lại ở cấp cao hơn, kế thừa chiêu cũ.`, 'Ouroboros');
  }

  function hitOuroboros(scene, boss, amount) {
    if (!boss || boss.dead) return;
    if (boss.phase === 2 && player.inheritTime <= 0) amount = Math.max(5, Math.floor(amount * 0.45));
    if (boss.phase === 3 && player.inheritTime > 0) amount = Math.floor(amount * 1.45);
    hitActor(boss, amount);
    scene.local.inheritCharge = clamp(scene.local.inheritCharge + 14, 0, 100);
    advanceOuroborosPhase(scene, boss);
  }

  function attackChapter4(scene, attackBox) {
    const boss = scene.bosses[0];
    if (boss && overlap(attackBox, boss)) hitOuroboros(scene, boss, 12);
    for (const enemy of scene.enemies) {
      if (enemy.dead || enemy.kind !== 'groundOuroboros' || !overlap(attackBox, enemy)) continue;
      hitActor(enemy, 18);
      if (enemy.hp <= 0) {
        enemy.dead = true;
        state.score += enemy.score || 25;
        scene.local.inheritCharge = clamp(scene.local.inheritCharge + 8, 0, 100);
      }
    }
  }

  function updateChapter4(scene, dt) {
    const boss = scene.bosses[0];
    if (!boss) return;
    scene.local.inheritCharge = clamp(scene.local.inheritCharge + dt * 2.5, 0, 100);
    if (!boss.dead) {
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (boss.x < boss.minX || boss.x > boss.maxX) {
        boss.vx *= -1;
        boss.x = clamp(boss.x, boss.minX, boss.maxX);
      }
      if (boss.y < boss.minY || boss.y > boss.maxY) {
        boss.vy *= -1;
        boss.y = clamp(boss.y, boss.minY, boss.maxY);
      }
      if (boss.y < boss.minY || boss.y > boss.maxY) {
        boss.vy *= -1;
        boss.y = clamp(boss.y, boss.minY, boss.maxY);
      }
    }
    scene.local.shotTimer -= dt;
    if (!boss.dead && scene.local.shotTimer <= 0) {
      scene.local.shotTimer = boss.phase === 1 ? 1.55 : boss.phase === 2 ? 1.25 : 1.0;
      const from = centerOf(boss);
      const spread = boss.phase === 1 ? [0] : boss.phase === 2 ? [-55, 55] : [-82, 0, 82];
      for (const offset of spread) {
        scene.projectiles.push({
          x: from.x + offset,
          y: from.y + boss.h / 2 - 8,
          w: boss.phase === 3 ? 20 : 16,
          h: boss.phase === 3 ? 20 : 16,
          vx: offset * 0.18,
          vy: 210 + boss.phase * 36,
          ttl: 3.4,
          damage: 6 + boss.phase * 2,
          color: boss.phase === 1 ? '#f97316' : boss.phase === 2 ? '#a855f7' : '#facc15',
          message: 'Ouroboros thả luận điểm từ bầu trời!',
        });
      }
    }
    scene.local.groundSpawnTimer -= dt;
    if (!boss.dead && scene.local.groundSpawnTimer <= 0) {
      scene.local.groundSpawnTimer = 60;
      const count = 1 + (scene.local.groundSpawnCount % 2);
      scene.local.groundSpawnCount += 1;
      for (let i = 0; i < count; i += 1) {
        const fromLeft = (scene.local.groundSpawnCount + i) % 2 === 0;
        scene.enemies.push({
          kind: 'groundOuroboros',
          name: 'Tàn dư phủ định',
          x: fromLeft ? 24 + i * 42 : WIDTH - 70 - i * 42,
          y: GROUND_Y - 46,
          w: 34,
          h: 46,
          vx: fromLeft ? 78 : -78,
          minX: 18,
          maxX: WIDTH - 52,
          hp: 28,
          maxHp: 28,
          damage: 9,
          score: 45,
          asset: 'enemyStone',
        });
      }
      quickMessage('Tàn dư mặt đất xuất hiện — dùng J cận chiến để xử lý!', 'Ouroboros');
    }
    if (boss.dead && boss.phase === 3) markComplete('Đã vượt qua chu kỳ phủ định biện chứng theo đường xoáy ốc đi lên.');
  }

  function drawChapter4(scene) {
    const boss = scene.bosses[0];
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = `rgba(196,181,253,${0.08 + i * 0.025})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(118 + i * 34, 96 + i * 24, 700 - i * 68, 350 - i * 42);
    }
    if (boss) {
      drawPixelText(`Chu kỳ xoáy ốc: pha ${boss.phase}/3`, WIDTH / 2, 112, 18, '#c4b5fd', 'center');
    }
    if (player.inheritTime > 0) drawPixelText(`KẾ THỪA: ${player.inheritTime.toFixed(1)}s`, WIDTH / 2, 144, 16, '#facc15', 'center');
  }

  // Chapter 5: historical materialism.
  function setupChapter5(scene) {
    scene.local.hasTool = false;
    scene.local.toolCharge = 0;
    scene.local.machineDestroyed = 0;
    scene.local.laserTimer = 1.45;
    scene.local.laserCharge = 0;
    scene.local.laserX = WIDTH / 2;
    scene.local.bounceTimer = 1.8;
    scene.pickups.push({ kind: 'blueprint', x: 154, y: GROUND_Y - 34, w: 42, h: 34, score: 90 });
    scene.gates.push(
      { x: 314, y: GROUND_Y - 104, w: 42, h: 104, hp: 34, maxHp: 34, label: 'PHÁP QUYỀN CŨ', color: '#475569', dead: false },
      { x: 520, y: GROUND_Y - 116, w: 42, h: 116, hp: 38, maxHp: 38, label: 'THIẾT CHẾ CŨ', color: '#64748b', dead: false },
    );
    scene.machines.push(
      { name: 'Quan hệ sở hữu lạc hậu', x: 410, y: GROUND_Y - 58, w: 54, h: 58, hp: 42, maxHp: 42, color: '#22d3ee', score: 90 },
      { name: 'Tổ chức quản lý trì trệ', x: 642, y: GROUND_Y - 58, w: 54, h: 58, hp: 42, maxHp: 42, color: '#2dd4bf', score: 90 },
      { name: 'Phân phối bất hợp lý', x: 742, y: GROUND_Y - 58, w: 54, h: 58, hp: 42, maxHp: 42, color: '#67e8f9', score: 90 },
      { name: 'Linh thạch Cơ sở hạ tầng', x: 850, y: GROUND_Y - 132, w: 68, h: 132, hp: 210, maxHp: 210, color: '#facc15', score: 520, finalCore: true },
    );
    scene.bosses.push({ name: 'Thượng tầng Bảo thủ', x: 780, y: 118, w: 78, h: 88, hp: 170, maxHp: 170, shield: true, color: '#dc2626', damage: 13, score: 420, vx: -92, vy: 46, minX: 560, maxX: 886, minY: 76, maxY: 218, floatPhase: 0 });
  }

  function skillChapter5(scene) {
    if (!scene.local.hasTool) {
      quickMessage('Chưa có bản vẽ công nghệ. Công cụ lao động là yếu tố động trong lực lượng sản xuất; thiếu nó thì chưa thể cải tạo quan hệ cũ.', 'Duy vật lịch sử');
      return;
    }
    if (scene.local.toolCharge < 100) {
      quickMessage('Công cụ lao động mới đang tích lũy năng lực. Hãy cải tạo các quan hệ sản xuất lạc hậu để tăng sức sản xuất.', 'Công cụ lao động');
      return;
    }
    scene.local.toolCharge = 0;
    player.toolTime = 4;
    quickMessage('Công cụ lao động mới được kích hoạt: lực lượng sản xuất phát triển, đòi hỏi quan hệ sản xuất phù hợp hơn.', 'Kỹ năng');
  }

  function attackChapter5(scene, attackBox) {
    const powered = scene.local.hasTool;
    for (const gate of scene.gates) {
      if (!gate.dead && !gate.open && overlap(attackBox, gate)) {
        if (!powered) {
          quickMessage('Cần bản vẽ công nghệ trước khi phá thiết chế cũ.', 'Kiến trúc thượng tầng');
        } else {
          hitActor(gate, player.toolTime > 0 ? 28 : 14, `${gate.label} bị vượt qua: thượng tầng cũ mất vai trò bảo vệ quan hệ lạc hậu.`);
          if (gate.dead) gate.open = true;
          scene.local.toolCharge = clamp(scene.local.toolCharge + 18, 0, 100);
        }
      }
    }

    for (const machine of scene.machines) {
      if (!machine.dead && overlap(attackBox, machine)) {
        if (!powered) {
          quickMessage('Đã nhận diện quan hệ sản xuất lạc hậu, nhưng cần công cụ lao động mới để cải tạo.', 'Cơ sở hạ tầng');
        } else {
          const isFinalCore = machine.finalCore;
          const damage = isFinalCore ? (player.toolTime > 0 ? 22 : 10) : (player.toolTime > 0 ? 30 : 16);
          hitActor(machine, damage, `${machine.name} bị cải tạo: cơ sở hạ tầng biến đổi, thượng tầng mất nền tảng cũ.`);
          scene.local.toolCharge = clamp(scene.local.toolCharge + (isFinalCore ? 12 : 22), 0, 100);
          if (isFinalCore && machine.dead) markComplete('Đã phá Linh thạch Cơ sở hạ tầng: boss không còn nền tảng duy trì.');
        }
      }
    }

    const boss = scene.bosses[0];
    if (boss && !boss.dead && overlap(attackBox, boss)) {
      quickMessage('Boss bay trên cao chỉ gây áp lực; mục tiêu thắng là phá Linh thạch ở cuối map.', 'Boss màn 5');
    }
  }
  function updateChapter5(scene, dt) {
    const boss = scene.bosses[0];
    scene.local.machineDestroyed = scene.machines.filter((machine) => machine.dead && !machine.finalCore).length;
    const finalCore = scene.machines.find((machine) => machine.finalCore);
    if (boss && scene.local.machineDestroyed >= scene.machines.filter((machine) => !machine.finalCore).length) {
      if (boss.shield) quickMessage('Các quan hệ sản xuất lạc hậu đã được cải tạo — kiến trúc thượng tầng bảo thủ mất cơ sở duy trì!', 'Duy vật lịch sử');
      boss.shield = false;
    }
    if (scene.local.hasTool) scene.local.toolCharge = clamp(scene.local.toolCharge + dt * 4, 0, 100);

    if (boss && !boss.dead) {
      boss.floatPhase += dt * (boss.shield ? 2.4 : 3.4);
      boss.vx = Math.sign(boss.vx || -1) * (boss.shield ? 92 : 128);
      boss.x += boss.vx * dt;
      boss.y += Math.sin(boss.floatPhase) * (boss.shield ? 42 : 62) * dt + boss.vy * dt;
      if (boss.x < boss.minX || boss.x > boss.maxX) {
        boss.vx *= -1;
        boss.x = clamp(boss.x, boss.minX, boss.maxX);
      }
      if (boss.y < boss.minY || boss.y > boss.maxY) {
        boss.vy *= -1;
        boss.y = clamp(boss.y, boss.minY, boss.maxY);
      }

      const enraged = !boss.shield;
      scene.local.laserTimer -= dt;
      if (scene.local.laserTimer <= 0 && scene.local.laserCharge <= 0) {
        scene.local.laserCharge = enraged ? 0.48 : 0.72;
        scene.local.laserX = clamp(centerOf(playerRect()).x, 92, WIDTH - 92);
        quickMessage('Thượng tầng bảo thủ khóa mục tiêu bằng tia cưỡng chế. Di chuyển khỏi vạch đỏ!', 'Boss màn 5');
      }
      if (scene.local.laserCharge > 0) {
        scene.local.laserCharge -= dt;
        if (scene.local.laserCharge <= 0) {
          const laser = { x: scene.local.laserX - 22, y: 58, w: 44, h: GROUND_Y - 58 };
          scene.effects.push({ ...laser, color: 'rgba(239,68,68,0.92)', ttl: 0.28, maxTtl: 0.28 });
          if (overlap(playerRect(), laser)) damagePlayer(enraged ? 18 : 13, 'Laser cưỡng chế của thượng tầng bảo thủ quét trúng bạn!');
          scene.local.laserTimer = enraged ? 1.05 : 1.55;
        }
      }

      scene.local.bounceTimer -= dt;
      if (scene.local.bounceTimer <= 0) {
        scene.local.bounceTimer = enraged ? 1.25 : 1.85;
        const from = centerOf(boss);
        const speed = enraged ? 285 : 235;
        const angles = enraged ? [-2.95, -2.55, -2.15, -1.75] : [-2.75, -2.35, -1.95];
        for (const angle of angles) {
          scene.projectiles.push({
            x: from.x - 10,
            y: from.y + 18,
            w: enraged ? 22 : 18,
            h: enraged ? 22 : 18,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            ttl: 5.2,
            damage: enraged ? 12 : 9,
            bounce: enraged ? 8 : 6,
            minX: 42,
            maxX: WIDTH - 24,
            minY: 82,
            maxY: GROUND_Y - 10,
            color: enraged ? '#fb7185' : '#f97316',
            message: 'Đạn luật lệ nảy quanh bản đồ: quan hệ cũ phản công từ nhiều phía!',
          });
        }
      }
    }

    if (finalCore && finalCore.dead) markComplete('Đã phá Linh thạch Cơ sở hạ tầng: boss không còn nền tảng duy trì.');
  }
  function drawChapter5(scene) {
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(94,234,212,0.14)' : 'rgba(251,113,133,0.12)';
      ctx.fillRect(70 + i * 92, 126 - (i % 3) * 18, 42, GROUND_Y - 126 + (i % 3) * 18);
      ctx.fillStyle = '#0f172a';
      for (let y = 144; y < GROUND_Y - 18; y += 32) ctx.fillRect(80 + i * 92, y, 10, 10);
    }
    const boss = scene.bosses[0];
    if (boss && boss.shield) {
      ctx.globalAlpha = 0.48;
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(806, 84, 26, 384);
      ctx.globalAlpha = 1;
      drawPixelText('KIẾN TRÚC THƯỢNG TẦNG', 820, 68, 13, '#dbeafe', 'center');
    }
    if (scene.local.laserCharge > 0) {
      const alpha = scene.local.laserCharge < 0.18 ? 0.9 : 0.52;
      ctx.fillStyle = `rgba(239,68,68,${alpha})`;
      ctx.fillRect(scene.local.laserX - 22, 58, 44, GROUND_Y - 58);
      drawPixelText('LASER CƯỠNG CHẾ', scene.local.laserX, 62, 12, '#fecaca', 'center');
    }
    const finalCore = scene.machines.find((machine) => machine.finalCore);
    drawPixelText(`Quan hệ SX cải tạo: ${scene.local.machineDestroyed}/3`, WIDTH / 2, 112, 18, '#5eead4', 'center');
    if (finalCore && !finalCore.dead) drawPixelText(`Linh thạch: ${Math.ceil(finalCore.hp)}/${finalCore.maxHp}`, WIDTH / 2, 142, 16, '#facc15', 'center');
  }
  applyGraphicsMode();
  updateGraphicsButtons();

  loadAssets().finally(() => {
    updateChapterButtons();
    requestAnimationFrame(gameLoop);
    updateHUD();
  });
})();
