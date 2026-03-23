// =====================
// Configuracion y constantes
// =====================
const FAV_KEY = "homepage_favlinks";
const GAMES_KEY = "homepage_games";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAvRfkQz-L2qqOfKfYV3-r0eVIgv9T9WfI",
  authDomain: "juegos-completados-a3005.firebaseapp.com",
  databaseURL:
    "https://juegos-completados-a3005-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "juegos-completados-a3005",
  storageBucket: "juegos-completados-a3005.firebasestorage.app",
  messagingSenderId: "1066323213139",
  appId: "1:1066323213139:web:cb0aaf585a08e692f4ffa6",
};

const WEATHER_KEY = "homepage_weather_loc";

const SELECTORS = {
  gamesList: "#gamesList",
  modal: "#modal",
  modalTitle: "#modalTitle",
  authModal: "#authModal",
  btnGoogleLogin: "#btnGoogleLogin",
  authError: "#authError",
  btnLogout: "#btnLogout",
  userEmail: "#userEmail",
  gameForm: "#gameForm",
  gTitle: "#gTitle",
  gPlatform: "#gPlatform",
  gDate: "#gDate",
  gScore: "#gScore",
  gScoreValue: "#gScoreValue",
  gScoreBubble: "#gScoreBubble",
  gHours: "#gHours",
  gCover: "#gCover",
  gNotes: "#gNotes",
  gamesSort: "#gamesSort",
  coverStatus: "#coverStatus",
  btnAdd: "#btnAdd",
  btnCancel: "#btnCancel",
  btnFindCover: "#btnFindCover",
  btnExport: "#btnExport",
  fileImport: "#fileImport",
  btnGeo: "#btnGeo",
  inpLat: "#inpLat",
  inpLon: "#inpLon",
  btnFetchWeather: "#btnFetchWeather",
  wTemp: "#wTemp",
  wDesc: "#wDesc",
  wPlace: "#wPlace",
  confirmModal: "#confirmModal",
  btnCancelDelete: "#btnCancelDelete",
  btnConfirmDelete: "#btnConfirmDelete",
  confirmGameTitle: "#confirmGameTitle",
  googleForm: "#googleForm",
  googleQuery: "#googleQuery",
  btnSearch: "#btnSearch",
  favConfirmModal: "#favConfirmModal",
  favConfirmUrl: "#favConfirmUrl",
  btnCancelFavDelete: "#btnCancelFavDelete",
  btnConfirmFavDelete: "#btnConfirmFavDelete",
};

// =====================
// Inicializacion Firebase
// =====================
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const auth = firebase.auth();

// =====================
// Estado global
// =====================
let games = [];
let editingId = null;
let pendingDeleteId = null;
let pendingFavIndex = null;
let currentUser = null;
let currentUid = null;
let appInitialized = false;
let gamesSortOrder = "date-desc";
const coverCache = {};

// =====================
// Weather mapping (Open-Meteo)
// =====================
const weatherCodes = {
  0: "Cielo despejado",
  1: "Principalmente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Neblina con depositos de hielo",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna densa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve intensa",
  80: "Chubascos ligeros",
  81: "Chubascos",
  82: "Chubascos intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo fuerte",
};
