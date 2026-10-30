import React, { useState, useMemo, useRef } from "react";
import { Search, Smile, Heart, Coffee, Globe, Bell, Sparkles, X } from "lucide-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_KEYWORDS: Record<string, string[]> = {
  // Smileys & emotions
  "😀": ["grinning", "happy", "smile"],
  "😃": ["smiley", "happy", "joy", "smile"],
  "😄": ["smile", "happy", "joy", "laugh"],
  "😁": ["grin", "happy", "smile", "teeth"],
  "😆": ["laughing", "satisfied", "haha", "lol"],
  "😅": ["sweat", "smile", "relief", "nervous"],
  "😂": ["joy", "tears", "laugh", "lol", "crying", "haha"],
  "🤣": ["rofl", "lol", "laugh", "rolling", "floor"],
  "🥹": ["holding", "back", "tears", "proud", "emotional", "pleading"],
  "😊": ["blush", "smile", "warm", "happy"],
  "😇": ["angel", "innocent", "halo"],
  "🙂": ["slightly", "smiling", "okay"],
  "🙃": ["upside", "down", "silly", "sarcasm"],
  "😉": ["wink", "flirt", "playful"],
  "😌": ["relieved", "calm", "peace"],
  "😍": ["heart", "eyes", "love", "crush"],
  "🥰": ["smiling", "hearts", "love", "adore"],
  "😘": ["kiss", "love", "blow"],
  "😗": ["kissing", "whistle"],
  "😙": ["kissing", "smile"],
  "😋": ["yum", "delicious", "tasty", "silly"],
  "😛": ["tongue", "silly", "playful"],
  "😜": ["wink", "tongue", "crazy", "silly"],
  "🤪": ["zany", "wild", "crazy"],
  "😝": ["squint", "tongue", "playful"],
  "🤑": ["money", "rich", "dollar"],
  "🤗": ["hug", "open", "arms"],
  "🤭": ["giggle", "oops", "hand", "covering"],
  "🤫": ["shh", "quiet", "secret", "silence"],
  "🤔": ["thinking", "hmm", "ponder", "wonder"],
  "🫡": ["salute", "respect", "yes", "sir"],
  "🤐": ["zipper", "mouth", "silent", "secret"],
  "🤨": ["eyebrow", "raised", "skeptical", "doubt"],
  "😐": ["neutral", "meh", "straight"],
  "😑": ["expressionless", "done", "annoyed"],
  "😶": ["silent", "mute", "speechless"],
  "🫥": ["dotted", "line", "invisible", "disappear"],
  "😏": ["smirk", "flirt", "sneaky"],
  "😒": ["unamused", "annoyed", "bored"],
  "🙄": ["rolling", "eyes", "whatever"],
  "😬": ["grimace", "awkward", "oops"],
  "🤥": ["lying", "pinocchio", "nose"],
  "😔": ["pensive", "sad", "down"],
  "😪": ["sleepy", "snooze", "tired"],
  "🤤": ["drool", "yummy"],
  "😴": ["sleeping", "zzz", "tired"],
  "😷": ["mask", "sick", "covid"],
  "🤒": ["thermometer", "fever", "sick"],
  "🤕": ["bandage", "hurt", "injury"],
  "🤢": ["nauseated", "gross", "sick"],
  "🤮": ["vomiting", "puke", "disgusted"],
  "🤧": ["sneezing", "cold", "allergy"],
  "🥵": ["hot", "sweating", "heat"],
  "🥶": ["cold", "freezing", "ice"],
  "🥴": ["woozy", "dizzy", "tipsy", "drunk"],
  "😵": ["dizzy", "knocked", "out"],
  "🤯": ["mind", "blown", "exploding", "shock", "wow"],
  "🤠": ["cowboy", "yeehaw"],
  "🥳": ["party", "celebrate", "birthday", "cheers"],
  "🥸": ["disguise", "glasses", "incognito"],
  "😎": ["cool", "sunglasses", "awesome"],
  "🤓": ["nerd", "geek", "glasses"],
  "🧐": ["monocle", "curious", "inspect"],
  "😕": ["confused", "unsure"],
  "🫤": ["skeptical", "unsure"],
  "😟": ["worried", "nervous"],
  "🙁": ["frown", "sad"],
  "😮": ["surprised", "gasp", "wow", "open"],
  "😯": ["hushed", "surprised"],
  "😲": ["astonished", "shocked", "wow"],
  "😳": ["flushed", "embarrassed", "wide", "eyes"],
  "🥺": ["pleading", "puppy", "eyes", "beg"],
  "😦": ["frowning", "open"],
  "😧": ["anguished", "distressed"],
  "😨": ["fearful", "scared"],
  "😰": ["anxious", "sweat", "nervous"],
  "😥": ["sad", "relieved"],
  "😢": ["crying", "tear", "sad"],
  "😭": ["sobbing", "bawling", "crying", "tears", "sad"],
  "😱": ["screaming", "fear", "scared", "horror"],
  "😖": ["confounded", "quivering"],
  "😣": ["persevering", "struggling"],
  "😞": ["disappointed", "sad"],
  "😓": ["downcast", "sweat"],
  "😩": ["weary", "tired"],
  "😫": ["tired", "exhausted"],
  "🥱": ["yawning", "bored", "sleepy"],
  "😤": ["triumph", "proud", "huff"],

  // Gestures & symbols
  "👍": ["thumbs", "up", "yes", "approve", "like", "agree", "ok"],
  "👎": ["thumbs", "down", "no", "dislike", "disapprove"],
  "👏": ["clapping", "applause", "bravo", "praise"],
  "🙌": ["raising", "hands", "hooray", "celebrate", "praise"],
  "👐": ["open", "hands"],
  "🤲": ["palms", "together", "prayer"],
  "🤝": ["handshake", "deal", "agree", "partnership"],
  "🙏": ["folded", "hands", "please", "thank", "you", "pray"],
  "✌️": ["peace", "victory", "two"],
  "🤞": ["fingers", "crossed", "luck", "hope"],
  "🫰": ["finger", "heart", "kpop", "love"],
  "🤟": ["love", "you", "gesture"],
  "🤘": ["rock", "metal", "horns"],
  "🤙": ["call", "me", "shaka", "hang", "loose"],
  "👈": ["point", "left"],
  "👉": ["point", "right"],
  "👆": ["point", "up"],
  "👇": ["point", "down"],
  "☝️": ["index", "up", "one"],
  "✋": ["raised", "hand", "stop", "high", "five"],
  "🤚": ["raised", "back", "hand"],
  "🖐️": ["fingers", "splayed"],
  "🖖": ["vulcan", "salute", "spock"],
  "👋": ["waving", "hand", "hello", "hi", "bye"],
  "💪": ["flexed", "biceps", "strong", "power", "muscle"],
  "🦾": ["mechanical", "arm", "robot"],
  "🖕": ["middle", "finger"],
  "✍️": ["writing", "hand", "pen"],
  "🤳": ["selfie", "camera"],
  "💅": ["nail", "polish", "fabulous"],
  "❤️": ["red", "heart", "love", "romantic"],
  "🧡": ["orange", "heart"],
  "💛": ["yellow", "heart"],
  "💚": ["green", "heart"],
  "💙": ["blue", "heart"],
  "💜": ["purple", "heart"],
  "🖤": ["black", "heart"],
  "🤍": ["white", "heart"],
  "🤎": ["brown", "heart"],
  "💔": ["broken", "heart", "breakup"],
  "❤️‍🔥": ["heart", "on", "fire"],
  "❤️‍🩹": ["mending", "heart", "healing"],
  "💕": ["two", "hearts", "love"],
  "💞": ["revolving", "hearts"],
  "💓": ["beating", "heart"],
  "💗": ["growing", "heart"],
  "💖": ["sparkling", "heart"],
  "💘": ["heart", "arrow", "cupid"],
  "💝": ["heart", "ribbon", "gift"],
  "🔥": ["fire", "flame", "lit", "hot"],
  "✨": ["sparkles", "stars", "magic", "clean", "shine"],
  "💥": ["collision", "boom", "explosion", "bang"],
  "💯": ["hundred", "points", "perfect", "score", "100"],
  "💢": ["anger", "vein"],
  "💫": ["dizzy", "star"],
  "💤": ["zzz", "sleep"],
  "💬": ["speech", "bubble", "message", "chat"],

  // Animals & Nature
  "🐶": ["dog", "puppy", "pet"],
  "🐱": ["cat", "kitten", "pet"],
  "🐭": ["mouse", "rodent"],
  "🐹": ["hamster"],
  "🐰": ["rabbit", "bunny"],
  "🦊": ["fox"],
  "🐻": ["bear"],
  "🐼": ["panda"],
  "🐨": ["koala"],
  "🐯": ["tiger"],
  "🦁": ["lion", "king"],
  "🐮": ["cow"],
  "🐷": ["pig"],
  "🐸": ["frog"],
  "🐵": ["monkey"],
  "🙈": ["see", "no", "evil"],
  "🙉": ["hear", "no", "evil"],
  "🙊": ["speak", "no", "evil"],
  "🐔": ["chicken"],
  "🐧": ["penguin"],
  "🐦": ["bird"],
  "🐤": ["baby", "chick"],
  "🦆": ["duck"],
  "🦅": ["eagle"],
  "🦉": ["owl", "wise"],
  "🦇": ["bat"],
  "🐺": ["wolf"],
  "🐗": ["boar"],
  "🐴": ["horse"],
  "🦄": ["unicorn", "magic"],
  "🐝": ["bee", "honey"],
  "🦋": ["butterfly"],
  "🐢": ["turtle"],
  "🐍": ["snake"],
  "🐙": ["octopus"],
  "🦈": ["shark"],
  "🐳": ["whale"],
  "🐬": ["dolphin"],

  // Food & Drink
  "🍎": ["apple", "red", "fruit"],
  "🍌": ["banana", "fruit"],
  "🍉": ["watermelon", "fruit", "summer"],
  "🍇": ["grapes", "fruit"],
  "🍓": ["strawberry", "berry"],
  "🥑": ["avocado"],
  "🍔": ["hamburger", "burger", "fast", "food"],
  "🍟": ["french", "fries"],
  "🍕": ["pizza", "cheese"],
  "🌮": ["taco", "mexican"],
  "🌯": ["burrito"],
  "🍣": ["sushi", "japanese"],
  "🍦": ["ice", "cream"],
  "🍩": ["doughnut", "donut"],
  "🍪": ["cookie", "biscuit"],
  "🎂": ["birthday", "cake"],
  "🍫": ["chocolate"],
  "☕": ["coffee", "tea", "cafe", "warm"],
  "🍵": ["tea", "green"],
  "🍺": ["beer", "drink", "cheers"],
  "🍷": ["wine", "drink"],

  // Travel & Places
  "🚗": ["car", "automobile"],
  "🚕": ["taxi", "cab"],
  "🚌": ["bus"],
  "🏎️": ["race", "car", "racing"],
  "🚓": ["police", "car"],
  "🚑": ["ambulance"],
  "🚒": ["fire", "truck"],
  "🛵": ["scooter", "motor"],
  "🚲": ["bicycle", "bike"],
  "🚀": ["rocket", "space", "launch", "moon"],
  "🛸": ["ufo", "alien", "flying", "saucer"],
  "✈️": ["airplane", "plane", "travel", "flight"],
  "🏝️": ["island", "beach", "tropical"],
  "🌋": ["volcano"],

  // Objects & Tools
  "💻": ["laptop", "computer", "macbook", "pc"],
  "📱": ["mobile", "phone", "iphone", "smartphone"],
  "🖥️": ["desktop", "computer", "monitor"],
  "⌨️": ["keyboard", "typing"],
  "🖲️": ["trackball", "mouse"],
  "🎮": ["video", "game", "controller"],
  "🕹️": ["joystick", "arcade"],
  "📷": ["camera", "photo"],
  "📸": ["flash", "camera"],
  "🎥": ["movie", "camera", "film"],
  "💡": ["light", "bulb", "idea"],
  "🔦": ["flashlight", "torch"],
  "💰": ["money", "bag", "dollar", "cash"],
  "💳": ["credit", "card"],
  "💎": ["gem", "diamond", "jewel"],
  "🎉": ["tada", "party", "popper", "celebrate"],
  "🎊": ["confetti", "ball"],
  "🎁": ["gift", "present"],
  "🏆": ["trophy", "winner", "award"],
  "🥇": ["first", "place", "gold", "medal"],
};

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊",
      "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄",
      "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
      "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳",
      "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯",
      "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭",
      "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
    ],
  },
  {
    id: "gestures",
    name: "Gestures",
    icon: Heart,
    emojis: [
      "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋",
      "🤚", "🖐️", "🖖", "👋", "💪", "🦾", "🖕", "✍️", "🤳", "💅",
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🔥",
      "✨", "💥", "💯", "💢", "💫", "💤", "💬",
    ],
  },
  {
    id: "animals",
    name: "Nature",
    icon: Sparkles,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧",
      "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄",
      "🐝", "🦋", "🐢", "🐍", "🐙", "🦈", "🐳", "🐬",
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: Coffee,
    emojis: [
      "🍏", "🍎", "🍌", "🍉", "🍇", "🍓", "🥑", "🍔", "🍟", "🍕",
      "🌮", "🌯", "🍣", "🍦", "🍩", "🍪", "🎂", "🍫", "☕", "🍵",
      "🍺", "🍷",
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: Globe,
    emojis: [
      "🚗", "🚕", "🚌", "🏎️", "🚓", "🚑", "🚒", "🛵", "🚲", "🚀",
      "🛸", "✈️", "🏝️", "🌋",
    ],
  },
  {
    id: "objects",
    name: "Objects",
    icon: Bell,
    emojis: [
      "📱", "💻", "🖥️", "⌨️", "🖲️", "🎮", "🕹️", "📷", "📸", "🎥",
      "💡", "🔦", "💰", "💳", "💎", "🎉", "🎊", "🎁", "🏆", "🥇",
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState("smileys");
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeTab);
      return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
    }

    // Search across all emojis by keywords or literal character
    const allEmojis = Array.from(new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis)));
    return allEmojis.filter((emoji) => {
      if (emoji.includes(q)) return true;
      const keywords = EMOJI_KEYWORDS[emoji];
      if (keywords) {
        return keywords.some((kw) => kw.includes(q) || q.includes(kw));
      }
      return false;
    });
  }, [search, activeTab]);

  const handleClear = () => {
    setSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
      <div className="emoji-picker-header">
        <div className="emoji-search-box">
          <Search size={14} className="emoji-search-icon" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search emoji (e.g. smile, heart, dog)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="emoji-search-input"
            enterKeyHint="search"
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="emoji-clear-btn"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {!search.trim() && (
        <div className="emoji-category-tabs">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className={`emoji-tab-btn ${activeTab === cat.id ? "active" : ""}`}
                onClick={() => setActiveTab(cat.id)}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}

      <div className="emoji-grid-scroll">
        {filteredEmojis.length === 0 ? (
          <div className="emoji-empty-state">
            <span>No emojis found for &quot;{search}&quot;.</span>
          </div>
        ) : (
          <div className="emoji-grid">
            {filteredEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                className="emoji-btn"
                title={EMOJI_KEYWORDS[emoji]?.join(", ") || emoji}
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
