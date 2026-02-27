// Centralized asset exports for medieval pixel art sprites (web version — URL paths)

// Backgrounds
export const backgrounds = {
  castle: '/sprites/CASTLE-MAIN_MENU_BG.png',
  castleWithLogo: '/sprites/background.png',
  homeNew: '/sprites/background_final.png',
  battlefield: '/sprites/battlefiled_temporary.png',
  duelArena: '/sprites/duel_arena.png',
};

// Logo
export const logo = '/sprites/Logo.png';

// Buttons (normal + pressed states)
export const buttons = {
  longUp: '/sprites/button-long-up.png',
  longDown: '/sprites/button-long-down.png',
  smallUp: '/sprites/button-smol-up.png',
  smallDown: '/sprites/button-smol-down.png',
};

// Panels and Scrolls (parchment containers)
export const panels = {
  popup: '/sprites/popup-menu.png',
  medScroll: '/sprites/med-scroll.png',
  longScroll: '/sprites/lrg-lonk-scroll.png',
  middleMenu: '/sprites/middle menu.png',
  rightMenu: '/sprites/right menu.png',
  orderPaper: '/sprites/order-paper-med.png',
  orderPaper2: '/sprites/order-paper-med2.png',
  middleUI: '/sprites/Middle_UI_Scroll.png',
  leftUI: '/sprites/Left_UI_Scroll.png',
  rightUI: '/sprites/RIght_UI_Scroll.png',
};

// Token logos
export const tokenLogos = {
  sol: '/sprites/solana_logo.png',
  skr: '/sprites/SKR_logo.png',
};

// Decorative UI elements
export const ui = {
  pfpHolder: '/sprites/PFP-holder.png',
  healthBar: '/sprites/health bar.png',
  torch: '/sprites/torch_sprite.png',
  hitsplat: '/sprites/hitsplat.png',
};

// Fighter character sprites (pre-split frames, 3x upscaled)
export const fighters = {
  barbarian: {
    idle: [
      '/sprites/units/barbarian/frames/idle_0.png',
      '/sprites/units/barbarian/frames/idle_1.png',
      '/sprites/units/barbarian/frames/idle_2.png',
      '/sprites/units/barbarian/frames/idle_3.png',
    ],
    walkDown: [
      '/sprites/units/barbarian/frames/walk_down_0.png',
      '/sprites/units/barbarian/frames/walk_down_1.png',
      '/sprites/units/barbarian/frames/walk_down_2.png',
    ],
    attackDown: [
      '/sprites/units/barbarian/frames/attack_down_0.png',
      '/sprites/units/barbarian/frames/attack_down_1.png',
      '/sprites/units/barbarian/frames/attack_down_2.png',
    ],
  },
  berserker: {
    idle: [
      '/sprites/units/berserker/frames/idle_0.png',
      '/sprites/units/berserker/frames/idle_1.png',
      '/sprites/units/berserker/frames/idle_2.png',
      '/sprites/units/berserker/frames/idle_3.png',
    ],
    walkUp: [
      '/sprites/units/berserker/frames/walk_up_0.png',
      '/sprites/units/berserker/frames/walk_up_1.png',
      '/sprites/units/berserker/frames/walk_up_2.png',
    ],
    attackUp: [
      '/sprites/units/berserker/frames/attack_up_0.png',
      '/sprites/units/berserker/frames/attack_up_1.png',
      '/sprites/units/berserker/frames/attack_up_2.png',
    ],
  },
};
