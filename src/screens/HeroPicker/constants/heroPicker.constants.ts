// heroPicker.constants.ts — референция на всяка стойност
import { Dimensions } from "react-native";

const { width: W } = Dimensions.get("window");

// —— Hero picker layout ——
/** Разстояние под заглавието до зоната на героя (ratio от височината, напр. 0.04 = 4%). */
export const HERO_PICKER_TITLE_TO_HERO_GAP = 0.015;
/** Разстояние между героя и футъра (ratio от височината, напр. 0.01 = 1%). */
export const HERO_PICKER_HERO_TO_FOOTER_GAP = 0;
/** Large screens: title -> hero gap ratio. */
export const HERO_PICKER_LARGE_SCREEN_TITLE_TO_HERO_GAP_RATIO = 0.05;
/** Large screens: hero -> footer gap ratio. */
export const HERO_PICKER_LARGE_SCREEN_HERO_TO_FOOTER_GAP_RATIO = 0.03;
/** Height breakpoint for "large screen" hero picker spacing. */
export const HERO_PICKER_LARGE_SCREEN_HEIGHT = 900;

/** Bottom offset за сцената (ratio от височината; отрицателно = по-надолу). */
export const HERO_PICKER_BOTTOM_ART_BOTTOM = -0.1;
/** Височина на сцената като дял от hero зоната (0..1). */
export const HERO_PICKER_BOTTOM_ART_HEIGHT_RATIO = 0.59;

// —— Carousel (превключване герои) ——
/** Продължителност (ms) на фазата „излизане”: slide out + fade out на текущия герой. */
export const CAROUSEL_OUT_DUR = 280;
/** Продължителност (ms) на фазата „влизане”: slide in + fade in на новия герой. */
export const CAROUSEL_IN_DUR = 360;
/** Разстояние (px) на slide при превключване: колко навън отива излизащият герой (и откъде идва входящият). Повече = по-навън преди спиране. */
export const CAROUSEL_DIST = Math.round(W * 0.9);
/** Дял (0–1) от CAROUSEL_OUT_DUR, през който opacity остава 1; след това започва fade до 0. 1 = само slide, без fade out. */
export const CAROUSEL_OPACITY_FADE_START_RATIO = 1;
/** По-голямо разстояние за slide (1.2× ширина) — за други варианти/overlay анимации, не в текущия HeroPickerScreen. */
export const SLIDE_DISTANCE = W * 1.2;

// —— Quote bubble (цитат след избор на герой) ——
/** Продължителност (ms) на появяването на балончето с цитат (translateY + opacity). */
export const QUOTE_ENTER_DUR = 520;
/** Интервал (ms) между поява на всяка буква при „печатане” на цитата. */
export const TYPE_INTERVAL_MS = 38;
/** Време (ms) да се държи финалния цитат преди да започне излизането (fade out + translateY нагоре). */
export const READ_HOLD_MS = 1000;
/** Продължителност (ms) на излизането на балончето (fade out + translateY). */
export const QUOTE_EXIT_DUR = 560;

// —— Swipe (жест за превключване) ——
/** Минимално преместване (px) по хоризонтала за да се счита свайп за „напред/назад”. В HeroPickerScreen може да се ползва локално 60. */
export const SWIPE_THRESHOLD = 40;
