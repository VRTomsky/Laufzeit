// Wo laeuft Bitweg? Lokal ueber server.py (127.0.0.1) oder online (GitHub Pages)
// ?web an die Adresse haengen erzwingt die Online-Version zum Testen.
export const IS_WEB = !/^(127\.0\.0\.1|localhost)$/.test(location.hostname) || new URLSearchParams(location.search).has('web');
