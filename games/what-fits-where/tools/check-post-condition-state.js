"use strict";

const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("index.html", "utf8");
const game = fs.readFileSync("js/game.js", "utf8");

const modalStart = html.indexOf('id="post-condition-modal"');
const modalEnd = html.indexOf('id="settings-modal"', modalStart);
assert(modalStart >= 0 && modalEnd > modalStart, "post-condition modal markup is present");

const modalHtml = html.slice(modalStart, modalEnd);
const preselected = modalHtml.match(/post-condition-option[^"]*\bis-selected\b/g) || [];
assert.strictEqual(preselected.length, 0, "post-condition options must not be preselected in HTML");

const resetStart = game.indexOf("function resetPostGameConditionCheck()");
const resetEnd = game.indexOf("function renderPostGameConditionCheck()", resetStart);
assert(resetStart >= 0 && resetEnd > resetStart, "post-condition reset function is present");

const resetSource = game.slice(resetStart, resetEnd);
["moodAfter", "fatigue", "perceivedDifficulty", "neededHelp", "replayIntent"].forEach(field => {
  assert.match(resetSource, new RegExp(`${field}: null`), `${field} starts empty`);
});

assert.match(game, /post-condition-next-button[\s\S]*disabled/, "next button disabled state is rendered");
assert.match(game, /post-condition-confirm-button[\s\S]*disabled/, "confirm button disabled state is rendered");
