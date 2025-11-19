"use client";

import { toPng } from "html-to-image";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type PokemonApiResponse = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      ["official-artwork"]?: {
        front_default: string | null;
      };
    };
  };
  types: { type: { name: string } }[];
};

type PokemonPick = {
  slotId: string;
  id: number;
  name: string;
  sprite: string;
  types: string[];
};

type TrainerAvatar = {
  id: string;
  name: string;
  sprite: string;
};

type CardPattern = "none" | "stars" | "grid" | "circles" | "diagonal" | "triangles" | "waves" | "zigzag";

const defaultTrainerAvatars: TrainerAvatar[] = [
  { id: "acetrainer-gen7", name: "Ace Trainer", sprite: "acetrainer-gen7.png" },
  { id: "cynthia", name: "Champion Cynthia", sprite: "cynthia.png" },
  { id: "breeder", name: "Pokémon Breeder", sprite: "pokemonbreeder-gen7.png" },
  { id: "bugcatcher", name: "Bug Catcher", sprite: "bugcatcher-gen3.png" },
  { id: "rocketgruntf", name: "Rocket Grunt", sprite: "rocketgruntf.png" },
  { id: "hexmaniac", name: "Hex Maniac", sprite: "hexmaniac-gen6.png" },
  { id: "rosa", name: "Rosa", sprite: "rosa.png" },
  { id: "hilbert", name: "Hilbert", sprite: "hilbert.png" },
];

const starterPokemon = ["pikachu", "charizard", "gengar", "lucario", "snorlax", "greninja"];

const presetColors = ["#ef5350", "#1976d2", "#2e7d32", "#ab47bc", "#ff7043", "#455a64"];

const cardPatterns: { id: CardPattern; label: string }[] = [
  { id: "none", label: "None" },
  { id: "stars", label: "Stars" },
  { id: "grid", label: "Grid" },
  { id: "circles", label: "Dots" },
  { id: "diagonal", label: "Stripes" },
  { id: "triangles", label: "Triangles" },
  { id: "waves", label: "Waves" },
  { id: "zigzag", label: "Zigzag" },
];

const favoriteTypeOptions = [
  "Bug",
  "Dark",
  "Dragon",
  "Electric",
  "Fairy",
  "Fighting",
  "Fire",
  "Flying",
  "Ghost",
  "Grass",
  "Ground",
  "Ice",
  "Normal",
  "Poison",
  "Psychic",
  "Rock",
  "Steel",
  "Water",
];
const favoriteGameOptions = [
  "Red & Blue",
  "Yellow",
  "Gold & Silver",
  "Crystal",
  "Ruby & Sapphire",
  "Emerald",
  "FireRed & LeafGreen",
  "Diamond & Pearl",
  "Platinum",
  "HeartGold & SoulSilver",
  "Black & White",
  "Black 2 & White 2",
  "X & Y",
  "Omega Ruby & Alpha Sapphire",
  "Sun & Moon",
  "Ultra Sun & Ultra Moon",
  "Let's Go Pikachu/Eevee",
  "Sword & Shield",
  "Brilliant Diamond & Shining Pearl",
  "Legends: Arceus",
  "Scarlet & Violet",
  "Pokémon Go",
  "Pokémon Ranger",
  "Pokémon TCG",
  "Pokémon Stadium",
  "Pokémon Stadium 2",
  "Pokémon Battle Revolution",
  "Pokémon ZA",
];


const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getTrainerAvatarUrl = (sprite: string) => `/api/trainer-avatar?sprite=${encodeURIComponent(sprite)}`;

const getPokemonSprite = (pokemon: PokemonApiResponse): string => {
  return (
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
  );
};

const normalizePokemonName = (value: string) => value.trim().toLowerCase();
const createSlotId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isHexColorLight = (hexColor: string) => {
  let normalized = hexColor.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }
  if (normalized.length !== 6) {
    return false;
  }
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return false;
  }
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.7;
};

const getPatternStyles = (pattern: CardPattern, isBackgroundLight: boolean, scale: number) => {
  const overlayColor = isBackgroundLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)";
  const safeScale = Math.max(scale, 0.1);
  switch (pattern) {
    case "stars":
      {
        const starSvg = `
          <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
            <polygon points='40,8 48,30 72,30 52,44 59,66 40,52 21,66 28,44 8,30 32,30' fill='${overlayColor}'/>
          </svg>
        `;
        return {
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(starSvg)}")`,
          backgroundSize: `${60 * safeScale}px ${60 * safeScale}px`,
        };
      }
    case "grid":
      return {
        backgroundImage: `linear-gradient(0deg, ${overlayColor} 1px, transparent 1px), linear-gradient(90deg, ${overlayColor} 1px, transparent 1px)`,
        backgroundSize: `${30 * safeScale}px ${30 * safeScale}px`,
      };
    case "circles":
      return {
        backgroundImage: `radial-gradient(${overlayColor} 25%, transparent 26%), radial-gradient(${overlayColor} 25%, transparent 26%)`,
        backgroundPosition: "0 0, 15px 15px",
        backgroundSize: `${30 * safeScale}px ${30 * safeScale}px`,
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${overlayColor}, ${overlayColor} ${6 * safeScale}px, transparent ${6 * safeScale}px, transparent ${
          18 * safeScale
        }px)`,
      };
    case "triangles":
      return {
        backgroundImage: `linear-gradient(150deg, ${overlayColor} 25%, transparent 25%), linear-gradient(210deg, ${overlayColor} 25%, transparent 25%)`,
        backgroundSize: `${40 * safeScale}px ${40 * safeScale}px`,
        backgroundPosition: `0 0, ${20 * safeScale}px ${20 * safeScale}px`,
      };
    case "waves":
      {
        const waveSvg = `
          <svg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'>
            <path d='M0 30 Q 15 5 30 30 T 60 30 T 90 30 T 120 30' stroke='${overlayColor}' stroke-width='4' fill='none'/>
            <path d='M0 45 Q 15 20 30 45 T 60 45 T 90 45 T 120 45' stroke='${overlayColor}' stroke-width='4' fill='none' opacity='0.5'/>
          </svg>
        `;
        return {
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(waveSvg)}")`,
          backgroundSize: `${80 * safeScale}px ${40 * safeScale}px`,
        };
      }
    case "zigzag":
      {
        const zigzagSvg = `
          <svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
            <polyline points='0,30 10,10 20,30 30,10 40,30 50,10 60,30 70,10 80,30' stroke='${overlayColor}' stroke-width='4' fill='none'/>
          </svg>
        `;
        return {
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(zigzagSvg)}")`,
          backgroundSize: `${60 * safeScale}px ${30 * safeScale}px`,
        };
      }
    default:
      return {};
  }
};

const waitForImages = async (container: HTMLElement) => {
  const images = Array.from(container.getElementsByTagName("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalHeight !== 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const handleResolve = () => {
          image.removeEventListener("load", handleResolve);
          image.removeEventListener("error", handleResolve);
          resolve();
        };
        image.addEventListener("load", handleResolve);
        image.addEventListener("error", handleResolve);
      });
    }),
  );
};

export default function Home() {
  const [trainerName, setTrainerName] = useState("Trainer");
  const [selectedAvatarId, setSelectedAvatarId] = useState(defaultTrainerAvatars[0].id);
  const [cardColor, setCardColor] = useState(presetColors[0]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonPick[]>([]);
  const [pokemonQuery, setPokemonQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [pokemonNames, setPokemonNames] = useState<string[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNoPokemonResults, setShowNoPokemonResults] = useState(false);
  const [remoteAvatars, setRemoteAvatars] = useState<TrainerAvatar[]>([]);
  const [avatarQuery, setAvatarQuery] = useState("");
  const [avatarSuggestions, setAvatarSuggestions] = useState<TrainerAvatar[]>([]);
  const [showNoAvatarResults, setShowNoAvatarResults] = useState(false);
  const [cardPattern, setCardPattern] = useState<CardPattern>("none");
  const [enablePatternWeight, setEnablePatternWeight] = useState(false);
  const [patternScale, setPatternScale] = useState(1);
  const [cardBackEnabled, setCardBackEnabled] = useState(true);
  const [favoriteTypeChoice, setFavoriteTypeChoice] = useState("");
  const [favoritePokemonChoice, setFavoritePokemonChoice] = useState("");
  const [favoriteGameChoice, setFavoriteGameChoice] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const previewFrontRef = useRef<HTMLDivElement>(null);
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportSheetRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const combinedAvatars = useMemo(() => {
    const map = new Map<string, TrainerAvatar>();
    defaultTrainerAvatars.forEach((avatar) => map.set(avatar.id, avatar));
    remoteAvatars.forEach((avatar) => {
      if (!map.has(avatar.id)) {
        map.set(avatar.id, avatar);
      }
    });
    return Array.from(map.values());
  }, [remoteAvatars]);

  const selectedAvatar = useMemo(() => {
    return combinedAvatars.find((avatar) => avatar.id === selectedAvatarId) ?? combinedAvatars[0] ?? defaultTrainerAvatars[0];
  }, [combinedAvatars, selectedAvatarId]);

  useEffect(() => {
    const randomAvatar = defaultTrainerAvatars[Math.floor(Math.random() * defaultTrainerAvatars.length)];
    setSelectedAvatarId(randomAvatar.id);
  }, []);

  const cardHasLightBackground = useMemo(() => isHexColorLight(cardColor), [cardColor]);
  const cardPrimaryTextClass = cardHasLightBackground ? "text-slate-900" : "text-white";
  const cardSecondaryTextClass = cardHasLightBackground ? "text-slate-700" : "text-white/80";
  const cardBorderClass = cardHasLightBackground ? "border-black/10" : "border-white/20";
  const cardAccentSurfaceClass = cardHasLightBackground ? "bg-black/10" : "bg-white/15";
  const cardTileSurfaceClass = cardHasLightBackground ? "bg-black/5" : "bg-white/15";
  const cardTileTextClass = cardHasLightBackground ? "text-slate-800" : "text-white";
  const favoritePokemonDisplay = favoritePokemonChoice ? favoritePokemonChoice.toUpperCase() : "";
  const favoriteTypeDisplay = favoriteTypeChoice ? favoriteTypeChoice.toUpperCase() : "";
  const favoriteGameDisplay = favoriteGameChoice || "";
  const cardEmptySlotBorderClass = cardHasLightBackground ? "border-black/20" : "border-white/30";
  const cardEmptySlotTextClass = cardHasLightBackground ? "text-slate-600" : "text-white/60";
  const effectivePatternScale = enablePatternWeight ? patternScale : 1;
  const patternStyle = useMemo(
    () => getPatternStyles(cardPattern, cardHasLightBackground, effectivePatternScale),
    [cardPattern, cardHasLightBackground, effectivePatternScale],
  );
  const pokemonBackOptions = useMemo(() => (pokemonNames.length ? pokemonNames : starterPokemon), [pokemonNames]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 2600);
  };

  const CardSurface = ({ children }: { children: ReactNode }) => (
    <div
      className={`relative flex w-full max-w-md overflow-hidden rounded-[32px] border p-4 shadow-2xl ${cardBorderClass} ${cardPrimaryTextClass}`}
      style={{ backgroundColor: cardColor, aspectRatio: "85.6 / 54" }}
    >
      {cardPattern !== "none" && (
        <div className="pointer-events-none absolute inset-0 opacity-60" style={patternStyle} />
      )}
      <div className="relative flex h-full w-full flex-col">{children}</div>
    </div>
  );

  const renderCardFront = (hideInteractive: boolean) => (
    <CardSurface>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`relative h-20 w-20 rounded-3xl p-2 ${cardAccentSurfaceClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getTrainerAvatarUrl(selectedAvatar.sprite)}
              alt={selectedAvatar.name}
              className="h-full w-full object-contain"
              loading="lazy"
              draggable={false}
              crossOrigin="anonymous"
            />
          </div>
          <div>
            <p className={`text-[0.6rem] uppercase tracking-[0.4em] ${cardSecondaryTextClass}`}>Trainer</p>
            <p className={`text-2xl font-bold drop-shadow ${cardPrimaryTextClass}`}>{trainerName.trim() || "Trainer"}</p>
            <p className={`text-[0.55rem] uppercase tracking-[0.3em] ${cardSecondaryTextClass}`}>{selectedAvatar.name}</p>
          </div>
        </div>
        <div className={`text-right text-[0.55rem] uppercase tracking-[0.4em] ${cardSecondaryTextClass}`}>
          <p>League Certified</p>
          <p>{new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="mt-2 flex-1 pb-1">
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-0.5">
                    {selectedPokemon.map((pokemon) => (
                      <div
                        key={pokemon.slotId}
                        className={`flex h-full flex-col rounded-xl p-0.5 text-center shadow-lg shadow-black/20 ${cardTileSurfaceClass}`}
                      >
              <div className="relative mx-auto h-8 w-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  className="h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(5,5,5,0.45)]"
                  loading="lazy"
                  draggable={false}
                  crossOrigin="anonymous"
                />
              </div>
              <div className={`mt-0.5 flex items-center justify-between gap-0.5 text-[0.46rem] font-semibold uppercase tracking-wide ${cardTileTextClass}`}>
                <span className={`truncate text-left ${cardTileTextClass}`}>{pokemon.name}</span>
                {!hideInteractive && (
                  <button
                    type="button"
                    onClick={() => removePokemon(pokemon.slotId)}
                    className="rounded-full bg-black/20 px-1 text-[0.46rem] font-bold text-rose-100 transition hover:bg-black/40"
                    aria-label={`Remove ${pokemon.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          {emptySlots.map((_, index) => (
            <div
              key={`empty-${index}`}
              className={`flex flex-col items-center justify-center rounded-2xl border border-dashed text-center text-[0.48rem] uppercase tracking-wide ${cardEmptySlotBorderClass} ${
                hideInteractive ? "" : cardEmptySlotTextClass
              }`}
            >
              {!hideInteractive && "Empty slot"}
            </div>
          ))}
        </div>
      </div>
    </CardSurface>
  );

  const renderCardBack = (showDetails: boolean) => (
    <CardSurface>
      <div className="flex h-full flex-col justify-between pb-6">
        <div>
          <p className={`text-[0.6rem] uppercase tracking-[0.4em] ${cardSecondaryTextClass}`}>Trainer Journal</p>
          <p className={`mt-1 text-2xl font-bold ${cardPrimaryTextClass}`}>{trainerName.trim() || "Trainer"}</p>
          <p className={`text-xs uppercase tracking-[0.3em] ${cardSecondaryTextClass}`}>League profile</p>
        </div>
        {showDetails ? (
          <div className={`mt-4 space-y-3 rounded-2xl p-4 ${cardAccentSurfaceClass}`}>
            <p className={`text-sm font-semibold ${cardPrimaryTextClass}`}>
            Favorite Pokémon: <span className="uppercase tracking-wide">{favoritePokemonDisplay}</span>
            </p>
            <p className={`text-sm font-semibold ${cardPrimaryTextClass}`}>
              Favorite Type: <span className="uppercase tracking-wide">{favoriteTypeDisplay || "—"}</span>
            </p>
            <p className={`text-sm font-semibold ${cardPrimaryTextClass}`}>
              Favorite Game: <span className="tracking-wide">{favoriteGameDisplay || "—"}</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className={`rounded-full border border-dashed px-4 py-2 text-xs uppercase tracking-[0.4em] ${cardSecondaryTextClass}`}>
              Card back
            </p>
          </div>
        )}
        <p className={`text-right text-xs uppercase tracking-[0.4em] ${cardSecondaryTextClass}`}>League Archives</p>
      </div>
    </CardSurface>
  );


  useEffect(() => {
    let isMounted = true;
    const fetchPokemonNames = async () => {
      try {
        const response = await fetch("/pokemon-list.json");
        if (!response.ok) {
          throw new Error("Unable to load Pokémon list.");
        }
        const data: { names?: string[] } = await response.json();
        if (!isMounted) return;
        setPokemonNames(data.names ?? []);
      } catch (error) {
        console.error("Failed to load cached Pokémon names", error);
      }
    };
    fetchPokemonNames();
    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    let isMounted = true;
    const fetchTrainerAvatars = async () => {
      try {
        const response = await fetch("/trainer-avatars.json");
        if (!response.ok) {
          throw new Error("Unable to load trainer avatars.");
        }
        const data: { avatars?: TrainerAvatar[] } = await response.json();
        if (!isMounted) return;
        setRemoteAvatars(data.avatars ?? []);
      } catch (error) {
        console.error("Failed to load cached trainer avatars", error);
      }
    };
    fetchTrainerAvatars();
    return () => {
      isMounted = false;
    };
  }, []);

  const updatePokemonSuggestions = (value: string) => {
    const sanitized = value.trim().toLowerCase();
    if (sanitized.length < 3) {
      setNameSuggestions([]);
      setShowNoPokemonResults(false);
      return;
    }
    if (pokemonNames.length === 0) {
      setNameSuggestions([]);
      return;
    }
    const matches = pokemonNames.filter((name) => name.startsWith(sanitized)).slice(0, 6);
    setNameSuggestions(matches);
    setShowNoPokemonResults(matches.length === 0);
  };

  const updateAvatarSuggestionList = (value: string) => {
    const sanitized = value.trim().toLowerCase();
    if (sanitized.length < 3) {
      setAvatarSuggestions([]);
      setShowNoAvatarResults(false);
      return;
    }
    if (combinedAvatars.length === 0) {
      setAvatarSuggestions([]);
      setShowNoAvatarResults(false);
      return;
    }
    const matches = combinedAvatars
      .filter((avatar) => avatar.name.toLowerCase().includes(sanitized))
      .slice(0, 8);
    setAvatarSuggestions(matches);
    setShowNoAvatarResults(matches.length === 0);
  };

  const addPokemon = async (query: string) => {
    const sanitizedQuery = query.trim().toLowerCase();
    if (!sanitizedQuery) {
      setStatusMessage("Enter a Pokémon name or Pokédex number first.");
      return;
    }
    if (selectedPokemon.length >= 6) {
      setStatusMessage("All six slots are filled. Remove a Pokémon to add another.");
      return;
    }

    try {
      setLoadingPokemon(true);
      setStatusMessage(null);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${sanitizedQuery}`);
      if (!response.ok) {
        throw new Error("Pokémon not found. Check the spelling and try again.");
      }
      const data = (await response.json()) as PokemonApiResponse;
      const sprite = getPokemonSprite(data);
      if (!sprite) {
        throw new Error("No artwork was returned for that Pokémon.");
      }
      const formattedPokemon: PokemonPick = {
        slotId: createSlotId(),
        id: data.id,
        name: capitalize(data.name),
        sprite,
        types: data.types.map((entry) => capitalize(entry.type.name)),
      };
      setSelectedPokemon((prev) => [...prev, formattedPokemon]);
      setPokemonQuery("");
      setNameSuggestions([]);
      setStatusMessage(`${formattedPokemon.name} added to your party!`);
      showToast(`${formattedPokemon.name} added to the front!`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Something went wrong while fetching that Pokémon.");
    } finally {
      setLoadingPokemon(false);
    }
  };

  const removePokemon = (slotId: string) => {
    setSelectedPokemon((prev) => prev.filter((pokemon) => pokemon.slotId !== slotId));
  };

  const handlePokemonSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addPokemon(pokemonQuery);
  };

  const handleQueryChange = (value: string) => {
    setPokemonQuery(value);
    updatePokemonSuggestions(value);
  };

  const handleSuggestionSelect = (value: string) => {
    setPokemonQuery("");
    setNameSuggestions([]);
    setShowNoPokemonResults(false);
    void addPokemon(value);
  };

  const handleAvatarQueryChange = (value: string) => {
    setAvatarQuery(value);
    updateAvatarSuggestionList(value);
  };

  const handleAvatarSuggestionSelect = (avatar: TrainerAvatar) => {
    setSelectedAvatarId(avatar.id);
    setAvatarQuery("");
    setAvatarSuggestions([]);
    setShowNoAvatarResults(false);
    showToast(`${avatar.name} added to the front!`);
  };

  const handleAvatarSelect = (avatar: TrainerAvatar) => {
    setSelectedAvatarId(avatar.id);
    showToast(`${avatar.name} added to the front!`);
  };

  const handleFavoritePokemonInput = (value: string) => {
    const normalized = normalizePokemonName(value);
    setFavoritePokemonChoice((previous) => {
      if (normalized && normalized !== previous) {
        showToast(`${capitalize(normalized)} saved to the back!`);
      }
      return normalized;
    });
  };

  const handleFavoriteTypeInput = (value: string) => {
    const trimmed = value.trim();
    setFavoriteTypeChoice((previous) => {
      if (trimmed && trimmed !== previous) {
        showToast(`${trimmed} saved to the back!`);
      }
      return trimmed;
    });
  };

  const handleFavoriteGameInput = (value: string) => {
    const trimmed = value.trim();
    setFavoriteGameChoice((previous) => {
      if (trimmed && trimmed !== previous) {
        showToast(`${trimmed} saved to the back!`);
      }
      return trimmed;
    });
  };

  useEffect(() => {
    if (!isToastVisible && toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 200);
      return () => clearTimeout(timeout);
    }
  }, [isToastVisible, toastMessage]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const captureNode = async (node: HTMLElement, backgroundColor: string) => {
    const previous = {
      position: node.style.position,
      left: node.style.left,
      top: node.style.top,
      opacity: node.style.opacity,
      pointerEvents: node.style.pointerEvents,
      zIndex: node.style.zIndex,
    };
    node.style.position = "fixed";
    node.style.left = "0px";
    node.style.top = "0px";
    node.style.opacity = "1";
    node.style.pointerEvents = "none";
    node.style.zIndex = "-1";
    await waitForImages(node);
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor,
    });
    node.style.position = previous.position;
    node.style.left = previous.left;
    node.style.top = previous.top;
    node.style.opacity = previous.opacity;
    node.style.pointerEvents = previous.pointerEvents;
    node.style.zIndex = previous.zIndex;
    return dataUrl;
  };

  const triggerDownload = async (dataUrl: string, filename: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type || "image/png" });

    const canShareFile = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });
    if (canShareFile && navigator.share) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch {
        // If sharing fails (dismissed or not supported), fall back to download.
      }
    }

    const blobUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    const supportsDownloadAttribute = typeof link.download !== "undefined";
    link.href = blobUrl;
    link.download = filename;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    if (!supportsDownloadAttribute) {
      window.open(blobUrl, "_blank");
    }
  };

  const handleDownload = async () => {
    if (!exportFrontRef.current) return;
    try {
      setStatusMessage("Preparing your PNG...");
      const dataUrl = await captureNode(exportFrontRef.current, "#ffffff");
      const printableName = trainerName.trim() ? trainerName.trim().toLowerCase().replace(/\s+/g, "-") : "trainer";
      await triggerDownload(dataUrl, `${printableName}-card.png`);
      setStatusMessage("Card downloaded as PNG! Check your Downloads folder.");
    } catch {
      setStatusMessage("Unable to build the PNG. Try again in a few seconds.");
    }
  };

  const handleDownloadSheet = async () => {
    if (!exportSheetRef.current) return;
    try {
      setStatusMessage("Building your print sheet...");
      const dataUrl = await captureNode(exportSheetRef.current, "#ffffff");
      const printableName = trainerName.trim() ? trainerName.trim().toLowerCase().replace(/\s+/g, "-") : "trainer";
      await triggerDownload(dataUrl, `${printableName}-card-sheet.png`);
      setStatusMessage("Triple sheet downloaded as PNG! Check your Downloads folder.");
    } catch {
      setStatusMessage("Unable to build the sheet. Try again in a few seconds.");
    }
  };

  const emptySlots = Array.from({ length: 6 - selectedPokemon.length });

  return (
    <div className="relative min-h-screen bg-slate-950/90 py-10 px-4 text-slate-100 sm:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
        <section className="w-full rounded-3xl bg-slate-900/60 p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur">
          <header className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Trainer Card Generator</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Craft your dream Pokémon team</h1>
            <p className="mt-2 text-sm text-slate-300">
              Pick an avatar, choose up to six Pokémon using the PokéAPI, pick a color, then download a print-ready PNG.
            </p>
          </header>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-white">Trainer name</label>
              <input
                value={trainerName}
                onChange={(event) => setTrainerName(event.target.value)}
                placeholder="Misty"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Find an avatar</p>
              <div className="mt-3">
                <p className="text-sm font-semibold text-white">Browse every trainer</p>
                <div className="relative mt-3">
                  <input
                    value={avatarQuery}
                    onChange={(event) => handleAvatarQueryChange(event.target.value)}
                    placeholder="Search for gym leaders, rivals, champions..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                  />
                  {(avatarSuggestions.length > 0 || showNoAvatarResults) && (
                    <ul className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-1 text-left shadow-2xl">
                      {avatarSuggestions.length === 0 && showNoAvatarResults ? (
                        <li className="px-3 py-2 text-sm font-semibold text-slate-400">No results</li>
                      ) : (
                        avatarSuggestions.map((avatar) => (
                          <li key={avatar.id}>
                            <button
                              type="button"
                              onClick={() => handleAvatarSuggestionSelect(avatar)}
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                            >
                              <div className="relative h-10 w-10 rounded-xl bg-white/10 p-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getTrainerAvatarUrl(avatar.sprite)}
                                  alt={avatar.name}
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                  draggable={false}
                                />
                              </div>
                              <span className="capitalize">{avatar.name}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">Data sourced from Pokémon Showdown trainer sprites.</p>
              </div>
              <div className="mt-4">
                <details className="rounded-2xl border border-white/10 bg-slate-900/40 p-4" open>
                  <summary className="cursor-pointer text-sm font-semibold text-white outline-none">Full avatar library</summary>
                  <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {combinedAvatars.map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => handleAvatarSelect(avatar)}
                          className={`flex flex-col items-center rounded-2xl border px-3 py-4 transition hover:border-indigo-300 ${
                            selectedAvatarId === avatar.id ? "border-indigo-300 bg-indigo-500/10" : "border-white/10 bg-white/5"
                          }`}
                        >
                          <div className="relative h-16 w-16 rounded-xl bg-black/20 p-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getTrainerAvatarUrl(avatar.sprite)}
                              alt={avatar.name}
                              className="h-full w-full object-contain drop-shadow-[0_4px_6px_rgba(15,15,15,0.6)]"
                              loading="lazy"
                              draggable={false}
                              crossOrigin="anonymous"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Add Pokémon</p>
              <form onSubmit={handlePokemonSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    value={pokemonQuery}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    placeholder="e.g. pikachu or 25"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                  />
                  {(nameSuggestions.length > 0 || showNoPokemonResults) && (
                    <ul className="absolute left-0 right-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-1 text-left shadow-xl">
                      {nameSuggestions.length === 0 && showNoPokemonResults ? (
                        <li className="px-3 py-2 text-sm font-semibold text-slate-400">No results</li>
                      ) : (
                        nameSuggestions.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              onClick={() => handleSuggestionSelect(name)}
                              className="flex w-full items-center rounded-2xl px-3 py-2 text-sm font-semibold capitalize text-white hover:bg-white/10"
                            >
                              {name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  disabled={loadingPokemon}
                >
                  {loadingPokemon ? "Searching..." : "Add Pokémon"}
                </button>
              </form>
              <p className="mt-2 text-xs text-slate-400">Powered by the PokéAPI sprites and Pokédex data.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {starterPokemon.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addPokemon(name)}
                    className="rounded-full border border-white/10 bg-slate-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-indigo-300 hover:text-white"
                  >
                    {capitalize(name)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Card color</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCardColor(color)}
                    aria-label={`Use ${color} for the card`}
                    className={`h-10 w-10 rounded-2xl border transition ${
                      cardColor === color ? "border-white" : "border-white/10"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-xs uppercase tracking-wide text-slate-200">
                  Custom
                  <input
                    type="color"
                    value={cardColor}
                    onChange={(event) => setCardColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-md border border-white/20 bg-transparent"
                    aria-label="Pick a custom card color"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Underprint pattern</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {cardPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => setCardPattern(pattern.id)}
                    className={`flex h-12 w-24 items-center justify-center rounded-2xl border text-xs font-semibold uppercase tracking-wide transition ${
                      cardPattern === pattern.id ? "border-white bg-white/10 text-white" : "border-white/10 bg-slate-900/40 text-slate-200"
                    }`}
                  >
                    {pattern.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Pattern weight</p>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <input
                    type="checkbox"
                    checked={enablePatternWeight}
                    onChange={(event) => setEnablePatternWeight(event.target.checked)}
                    className="h-4 w-4 accent-indigo-400"
                  />
                  Enable
                </label>
              </div>
              {enablePatternWeight && (
                <div className="mt-4">
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={patternScale}
                    onChange={(event) => setPatternScale(parseFloat(event.target.value))}
                    className="w-full accent-indigo-400"
                  />
                  <p className="mt-2 text-xs text-slate-400">{patternScale.toFixed(1)}×</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Card back</p>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <input
                    type="checkbox"
                    checked={cardBackEnabled}
                    onChange={(event) => setCardBackEnabled(event.target.checked)}
                    className="h-4 w-4 accent-indigo-400"
                  />
                  Use bio
                </label>
              </div>
              {cardBackEnabled && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Favorite Pokémon
                    <input
                      list="favorite-pokemon-options"
                      value={favoritePokemonDisplay}
                      onChange={(event) => handleFavoritePokemonInput(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                      placeholder="Search Pokémon"
                    />
                    <datalist id="favorite-pokemon-options">
                      {pokemonBackOptions.map((option) => (
                        <option key={option} value={capitalize(option)} />
                      ))}
                    </datalist>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Favorite Type
                    <input
                      list="favorite-type-options"
                      value={favoriteTypeChoice}
                      onChange={(event) => handleFavoriteTypeInput(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                      placeholder="Search type"
                    />
                    <datalist id="favorite-type-options">
                      {favoriteTypeOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Favorite Game
                    <input
                      list="favorite-game-options"
                      value={favoriteGameChoice}
                      onChange={(event) => handleFavoriteGameInput(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                      placeholder="Search games"
                    />
                    <datalist id="favorite-game-options">
                      {favoriteGameOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={handleDownload}
                type="button"
                className="flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Download trainer card
              </button>
              <button
                onClick={handleDownloadSheet}
                type="button"
                className="flex items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
              >
                Download triple sheet
              </button>
              <p className="text-xs text-slate-400">
                The PNG exports at 2× resolution, perfect for sharing or printing.
              </p>
            </div>

            {statusMessage && <p className="text-sm text-amber-200">{statusMessage}</p>}
          </div>
        </section>

        <section className="w-full rounded-3xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 p-6 shadow-2xl ring-1 ring-white/5 lg:sticky lg:top-8 lg:h-fit">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Live preview</p>
          <div className="mt-4 flex w-full justify-center">
            <div className="flex w-full flex-col items-center">
              <div ref={previewFrontRef} className="w-full max-w-md">
                {renderCardFront(false)}
              </div>
              <div className="mt-6 w-full max-w-md">{renderCardBack(cardBackEnabled)}</div>
            </div>
          </div>
        </section>
      </main>
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden ref={exportFrontRef}>
        <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-6 shadow-2xl">
          <div className="w-full">{renderCardFront(true)}</div>
          <div className="mt-6 w-full">{renderCardBack(cardBackEnabled)}</div>
        </div>
      </div>
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden ref={exportSheetRef}>
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-6 shadow-2xl">
          {[0, 1, 2].map((index) => (
            <div key={`sheet-${index}`} className="flex w-full max-w-md flex-col items-center">
              <div className="w-full">{renderCardFront(true)}</div>
              <div className="mt-6 w-full">{renderCardBack(cardBackEnabled)}</div>
            </div>
          ))}
        </div>
      </div>
      {toastMessage && (
        <div
          className={`fixed right-4 top-4 z-50 transform transition-all duration-300 ${
            isToastVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow-2xl shadow-emerald-500/40 ring-1 ring-white/30">
            <span className="text-xl" aria-hidden>
              ✓
            </span>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-wide">Added to the card</p>
              <p className="text-sm leading-snug text-emerald-50">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
