// Verzeichnis aller Projekte und freien Aufgaben (Deutsch oder Englisch, gleiche IDs)

import { pythonProjects, pythonChallenges } from './python.js';
import { cppProjects, cppChallenges } from './cpp.js';
import * as pyEn from './en/python.js';
import * as cppEn from './en/cpp.js';
import { isEn } from '../../i18n.js';

const EN = isEn();
export const PROJECTS = EN ? { python: pyEn.pythonProjects, cpp: cppEn.cppProjects } : { python: pythonProjects, cpp: cppProjects };
export const CHALLENGES = EN ? { python: pyEn.pythonChallenges, cpp: cppEn.cppChallenges } : { python: pythonChallenges, cpp: cppChallenges };
