/* 지도 오버레이 UI 
==========================================================================*/
const mapUI = {
  // 1. 설정값 및 셀렉터 관리
  config: {
    selectors: {
      panel: '[data-map-panel]',
      btnClose: '[data-map-panel-close]',
      sliderWrap: '[data-map-slider]',
      range: '[data-map-range]',
      thumb: '[data-map-thumb]',
      track: '.map-slider-track',
      btnIn: '[data-map-zoom-in]',
      btnOut: '[data-map-zoom-out]',
    },
    activeClass: 'is-hidden',
  },

  // 2. 초기화
  init() {
    this.initPanels();
    this.initSliders();
  },

  // 3. 패널 닫기 로직 (이벤트 위임)
  initPanels() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest(this.config.selectors.btnClose);
      if (btn) {
        const panel = btn.closest(this.config.selectors.panel);
        if (panel) panel.classList.add(this.config.activeClass);
      }
    });
  },

  // 4. 슬라이더 로직 (다중 인스턴스 대응)
  initSliders() {
    const sliders = document.querySelectorAll(this.config.selectors.sliderWrap);
    
    sliders.forEach(wrap => {
      const state = {
        range: wrap.querySelector(this.config.selectors.range),
        thumb: wrap.querySelector(this.config.selectors.thumb),
        track: wrap.querySelector(this.config.selectors.track),
        btnIn: document.querySelector(this.config.selectors.btnIn),
        btnOut: document.querySelector(this.config.selectors.btnOut),
        isDragging: false
      };

      if (!state.range || !state.thumb || !state.track) return;

      const MIN = parseFloat(state.range.min) || 0;
      const MAX = parseFloat(state.range.max) || 100;
      const STEP = parseFloat(state.range.step) || 1;

      // UI 업데이트 핵심 함수
      const update = (value) => {
        const snapped = Math.round((value - MIN) / STEP) * STEP + MIN;
        const validValue = Math.min(MAX, Math.max(MIN, snapped));

        state.range.value = validValue;
        state.range.setAttribute('data-value', validValue);

        // 상단이 MAX, 하단이 MIN인 수직 구조 계산
        const percent = (validValue - MIN) / (MAX - MIN);
        state.thumb.style.top = `${(1 - percent) * 100}%`;
      };

      // 좌표 계산 함수
      const handlePointer = (clientY) => {
        const rect = state.track.getBoundingClientRect();
        const pos = (clientY - rect.top) / rect.height;
        const percent = 1 - Math.min(1, Math.max(0, pos));
        update(MIN + (percent * (MAX - MIN)));
      };

      // 드래그 이벤트 바인딩
      state.track.addEventListener('pointerdown', (e) => {
        state.isDragging = true;
        state.track.setPointerCapture(e.pointerId);
        handlePointer(e.clientY);
      });

      state.track.addEventListener('pointermove', (e) => {
        if (state.isDragging) handlePointer(e.clientY);
      });

      ['pointerup', 'pointercancel'].forEach(type => {
        state.track.addEventListener(type, () => state.isDragging = false);
      });

      // +/- 버튼 바인딩 (해당 슬라이더 범위 내)
      const step = (dir) => update(parseFloat(state.range.value) + (dir * STEP));
      if (state.btnIn) state.btnIn.onclick = () => step(1);
      if (state.btnOut) state.btnOut.onclick = () => step(-1);

      // 초기 렌더링
      update(parseFloat(state.range.value) || MIN);
    });
  }
};

// 페이지 로드 시 통합 실행
document.addEventListener("DOMContentLoaded", () => {
  mapUI.init();
});
