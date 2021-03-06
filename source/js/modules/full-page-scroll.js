import throttle from 'lodash/throttle';
import gameTimer from './game-timer';
import prizes from './prizes';

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);

    this.activeScreen = 0;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);

    this.onUrlHashChanged();
  }

  onScroll(evt) {
    const currentPosition = this.activeScreen;
    this.reCalculateActiveScreenPosition(evt.deltaY);
    if (currentPosition !== this.activeScreen) {
      this.changePageDisplay();
    }
  }

  onUrlHashChanged() {
    this.lastScreen = this.activeScreen;
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);
    this.activeScreen = (newIndex < 0) ? 0 : newIndex;
    if (this.lastScreen === 3) {
      const rulesLink = document.getElementsByClassName(`rules__link`)[0];
      rulesLink.style.animationPlayState = `paused`;
    }
    this.changePageDisplay();
  }

  changePageDisplay() {
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  changeVisibilityDisplay() {
    clearTimeout(this.screenTimeout);
    const delay = this.lastScreen === 1 && this.activeScreen === 2 ? 600 : 0;
    this.screenElements.forEach((screen) => {
      screen.classList.remove(`screen--hidden-animation`);
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });
    if (delay) {
      this.screenElements[this.lastScreen].classList.remove(`screen--hidden`);
      this.screenElements[this.lastScreen].classList.add(`screen--hidden-animation`);
    }
    this.screenTimeout = setTimeout(() => {
      if (delay) {
        this.screenElements[this.lastScreen].classList.remove(`screen--hidden-animation`);
        this.screenElements[this.lastScreen].classList.add(`screen--hidden`);
      }
      this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);
      this.screenElements[this.activeScreen].classList.add(`active`);
    }, delay);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);
    if (activeItem) {
      if (activeItem.getAttribute(`data-href`) === `prizes`) {
        prizes.startAnimation();
      } else if (activeItem.getAttribute(`data-href`) === `game`) {
        gameTimer.start();
      }
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }
}
