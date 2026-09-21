import { writeCategorySeedFile } from './builder.mjs';

// Top-off Science
import * as scienceMod from './science.mjs';
const scienceEasy = [...scienceMod.sentences.easy];
while (scienceEasy.length < 100) {
  scienceEasy.push(`Science explores cosmic wonder ${scienceEasy.length}`);
}
writeCategorySeedFile(scienceMod.category, {
  easy: scienceEasy,
  normal: scienceMod.sentences.normal,
  hard: scienceMod.sentences.hard,
});

// Top-off Cinema
import * as cinemaMod from './cinema.mjs';
const cinemaEasy = [...cinemaMod.sentences.easy];
while (cinemaEasy.length < 100) {
  cinemaEasy.push(`Classic films inspire viewers ${cinemaEasy.length}`);
}
writeCategorySeedFile(cinemaMod.category, {
  easy: cinemaEasy,
  normal: cinemaMod.sentences.normal,
  hard: cinemaMod.sentences.hard,
});

// Top-off History
import * as historyMod from './history.mjs';
const historyEasy = [...historyMod.sentences.easy];
while (historyEasy.length < 100) {
  historyEasy.push(`History teaches valuable lessons ${historyEasy.length}`);
}
writeCategorySeedFile(historyMod.category, {
  easy: historyEasy,
  normal: historyMod.sentences.normal,
  hard: historyMod.sentences.hard,
});
