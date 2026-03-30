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


/* 풀스크린 스피너 UI 샘플
==========================================================================*/
const spinnerUI = {
  config: {
    selector: '#fullScreenSpinner',
    activeClass: 'is-active',
  },

  init() {
    const spinner = document.querySelector(this.config.selector);
    if (!spinner) return;

    // 빈 영역(레이어 전체) 클릭 시 닫기 이벤트
    spinner.addEventListener('click', () => {
      this.hide();
    });
  },

  show() {
    const spinner = document.querySelector(this.config.selector);
    if (spinner) {
      spinner.classList.add(this.config.activeClass);
      document.body.style.overflow = 'hidden'; // 스크롤 방지
    }
  },

  hide() {
    const spinner = document.querySelector(this.config.selector);
    if (spinner) {
      spinner.classList.remove(this.config.activeClass);
      document.body.style.overflow = ''; // 스크롤 복구
    }
  }
};

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  spinnerUI.init();
});


/* 년도/월 전용 커스텀 픽커 UI 
==========================================================================*/
const krds_monthPicker = {
  pickerAreas: null,

  init() {
    this.pickerAreas = document.querySelectorAll(".month-picker-conts");

    if (!this.pickerAreas.length) return;

    this.setupPickers();
    this.setupGlobalListeners();
  },

  setupPickers() {
    this.pickerAreas.forEach((wrap, index) => {
      const input = wrap.querySelector(".month-picker-input");
      const btnOpen = wrap.querySelector(".form-btn-monthpicker");
      const pickerArea = wrap.querySelector(".krds-month-picker-area");

      const btnPrev = pickerArea.querySelector(".btn-prev-year");
      const btnNext = pickerArea.querySelector(".btn-next-year");
      const yearLabel = pickerArea.querySelector(".current-year");
      const monthBtns = pickerArea.querySelectorAll(".btn-month");

      const btnCancel = pickerArea.querySelector(".btn-cancel");
      const btnConfirm = pickerArea.querySelector(".btn-confirm");

      let currentViewYear = new Date().getFullYear();
      let selectedYear = currentViewYear;
      let selectedMonth = null;

      const uniqueIdx = `month-picker-${index}-${Math.random().toString(36).substring(2, 9)}`;
      btnOpen.setAttribute("aria-expanded", "false");
      btnOpen.setAttribute("aria-controls", uniqueIdx);
      pickerArea.setAttribute("id", uniqueIdx);

      const updateHeader = () => {
        yearLabel.textContent = `${currentViewYear}년`;
      };

      const updateMonthButtons = () => {
        monthBtns.forEach((btn) => {
          const btnMonth = parseInt(btn.getAttribute("data-month"), 10);
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");

          if (currentViewYear === selectedYear && btnMonth === selectedMonth) {
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
          }
        });
      };

      const syncFromInput = () => {
        if (input.value) {
          const parts = input.value.split('.');
          if (parts.length === 2) {
            currentViewYear = parseInt(parts[0], 10);
            selectedYear = currentViewYear;
            selectedMonth = parseInt(parts[1], 10);
          }
        }
        updateHeader();
        updateMonthButtons();
      };

      // 열기 이벤트
      btnOpen.addEventListener("click", () => {
        this.closeAllPickers();
        syncFromInput();

        pickerArea.classList.add("active");
        btnOpen.setAttribute("aria-expanded", "true");

        const parentAccordion = wrap.closest('.accordion-item');
        if (parentAccordion) {
          parentAccordion.classList.add('has-open-picker');
        }

        if (typeof common !== 'undefined' && common.focusTrap) {
          common.focusTrap(pickerArea);
        }

        const calendarWrap = pickerArea.querySelector('.calendar-wrap');
        if (calendarWrap) {
          setTimeout(() => { calendarWrap.focus(); }, 50);
        } else {
          setTimeout(() => { pickerArea.focus(); }, 50);
        }
      });

      // 년도 이동 이벤트
      btnPrev.addEventListener("click", () => {
        currentViewYear -= 1;
        updateHeader();
        updateMonthButtons();
      });

      btnNext.addEventListener("click", () => {
        currentViewYear += 1;
        updateHeader();
        updateMonthButtons();
      });

      // 월 선택 이벤트
      monthBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          selectedYear = currentViewYear;
          selectedMonth = parseInt(e.target.getAttribute("data-month"), 10);
          updateMonthButtons();
        });
      });

      // 취소/선택 버튼
      btnCancel.addEventListener("click", () => this.closePicker(pickerArea, btnOpen));
      btnConfirm.addEventListener("click", () => {
        if (selectedMonth !== null) {
          const formattedMonth = String(selectedMonth).padStart(2, "0");
          input.value = `${selectedYear}.${formattedMonth}`;
        }
        this.closePicker(pickerArea, btnOpen);
      });
    });
  },

  closePicker(pickerArea, triggerBtn) {
    pickerArea.classList.remove("active");

    const parentAccordion = pickerArea.closest('.accordion-item');
    if (parentAccordion) {
      parentAccordion.classList.remove('has-open-picker');
    }

    if (triggerBtn) {
      triggerBtn.setAttribute("aria-expanded", "false");
      triggerBtn.focus();
    }
  },

  closeAllPickers() {
    this.pickerAreas.forEach((wrap) => {
      const pickerArea = wrap.querySelector(".krds-month-picker-area");
      const btnOpen = wrap.querySelector(".form-btn-monthpicker");

      if (pickerArea.classList.contains("active")) {
        this.closePicker(pickerArea, btnOpen);
      }
    });
  },

  setupGlobalListeners() {
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".month-picker-conts")) {
        this.closeAllPickers();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        this.closeAllPickers();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  krds_monthPicker.init();
});


/* 중첩 아코디언 UI (2, 3 Depth 전용)
==========================================================================*/
const customNestedAccordion = {
  init() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".nested-acc-btn");
      if (!btn) return;

      const item = btn.closest(".nested-acc-item");
      const body = item.querySelector(":scope > .nested-acc-body");

      if (!body) return;

      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        btn.setAttribute("aria-expanded", "false");
        body.style.display = "none";
      } else {
        btn.setAttribute("aria-expanded", "true");
        body.style.display = "block";
      }
    });
  }
};

window.addEventListener("DOMContentLoaded", () => {
  customNestedAccordion.init();
});
