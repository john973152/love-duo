/**
 * 游戏进度管理（LocalStorage）
 * 提供 saveProgress / loadProgress / resetProgress /
 *       completeStage / unlockStage / goToStage
 */
import { STAGES } from '../data/content.js';

const KEY = 'love-duo-progress-v1';

export function defaultState() {
  return {
    currentStage: 1,
    completedStages: [],
    unlockedStages: ['home', 'wheel'],
    claimedGifts: [],
    wheelAttempts: 0,   // 转盘已抽次数（拼多多式：前几次抽不中）
    wheelBoosted: false, // 男朋友助力后必得大奖
    quizCompleted: false,
    puzzleCompleted: [],
    treasureFound: [],
    // 秘密房间的进度（权威状态源；H5 SVG 表现）
    treasureRoom: {
      diaryDone: false,      // 台灯谜题已解（第一次回答会被拒绝，riddleFirst 记录首次答案）
      riddleFirst: null,     // 谜题第一次提交的答案（归一化后）
      lampOn: false,         // 台灯已点亮
      dollDone: false,       // 玩偶信封已开（获得钥匙）
      drawerOpen: false,     // 床头柜抽屉已打开
      bookshelfSolved: false,// 书架谜题已解
      photoClue: false,      // 照片背面线索已看
      rugLifted: false,      // 地毯已掀开（暗门与宝箱已发现）
      chestOpen: false,      // 宝箱已开启
      reward: 'none',        // 宝箱奖励：none 未开始 / paid 已付款 / received 已收货 / done 已评价通关
      cluesFound: []         // 已收集线索 ['lamp','drawer','photo','shelf']
    },
    timelineViewed: [],
    timelineDates: {},  // 她手动填写的日期 { 节点下标: '2025.11.16' }
    timelineQuizDone: false, // 时间胶囊「回忆填空」互动是否已完成
    futureChoices: [],
    videoWatched: false,
    letterOpened: false,
    finalCompleted: false,
    theme: 'shopping' // shopping | romantic
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const merged = { ...defaultState(), ...JSON.parse(raw) };
    if (!merged.unlockedStages.includes('wheel')) merged.unlockedStages.push('wheel');
    return merged;
  } catch {
    return defaultState();
  }
}

export function saveProgress(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 隐私模式等场景忽略 */ }
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
  _state = defaultState(); // 同步重置内存中的状态，避免 ?reset&unlock 组合时残留旧进度
}

let _state = loadProgress();
export const getState = () => _state;

function commit() {
  saveProgress(_state);
  document.dispatchEvent(new CustomEvent('progress:changed', { detail: _state }));
}

/** 完成某章节并解锁下一章 */
export function completeStage(stageId) {
  const idx = STAGES.findIndex(s => s.id === stageId);
  if (idx < 0 || _state.completedStages.includes(stageId)) return;
  _state.completedStages.push(stageId);
  if (STAGES[idx + 1] && !_state.unlockedStages.includes(STAGES[idx + 1].id)) {
    _state.unlockedStages.push(STAGES[idx + 1].id);
  }
  _state.currentStage = Math.min(idx + 1, STAGES.length - 1);
  commit();
}

export function unlockStage(stageId) {
  if (!_state.unlockedStages.includes(stageId)) {
    _state.unlockedStages.push(stageId);
    commit();
  }
}

/** 跳转到章节（未解锁则拒绝，防止误触最终礼物） */
export function goToStage(stageId) {
  if (!_state.unlockedStages.includes(stageId)) return false;
  const idx = STAGES.findIndex(s => s.id === stageId);
  if (idx >= 0) { _state.currentStage = idx; commit(); }
  return true;
}

export function patchState(partial) {
  Object.assign(_state, partial);
  commit();
}

/** 是否全部通关（final 之前的游戏章节全部完成） */
export function allGamesDone() {
  const gameIds = STAGES.filter(s => s.game && s.game !== 'final').map(s => s.id);
  return gameIds.every(id => _state.completedStages.includes(id));
}
