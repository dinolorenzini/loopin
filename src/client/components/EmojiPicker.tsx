import React, { useState, useMemo } from "react";
import { Search, Smile, Heart, Coffee, Globe, Bell, Sparkles } from "lucide-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

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
      "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢",
      "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
    ],
  },
  {
    id: "gestures",
    name: "Gestures",
    icon: Heart,
    emojis: [
      "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋",
      "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🤳",
      "💅", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
      "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘",
      "💝", "💟", "🔥", "✨", "💥", "💯", "💢", "💫", "💤", "💬",
    ],
  },
  {
    id: "animals",
    name: "Nature",
    icon: Sparkles,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
      "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
      "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
      "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞",
      "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍",
      "🦎", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬",
      "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧",
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: Coffee,
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦",
      "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐",
      "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇",
      "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮",
      "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱",
      "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🍢", "🍡",
      "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫",
      "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🧃", "🥤", "🧋", "🍺",
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: Globe,
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️", "🛺", "🚲", "🛴", "🛹",
      "🛼", "🚨", "🚔", "✈️", "🛫", "🛬", "🛩️", "🚀", "🛸", "🚁",
      "🛶", "⛵", "🚤", "🛥️", "🛳️", "🚢", "⚓", "🪝", "⛽", "🚧",
      "🚦", "🚥", "🗺️", "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡",
      "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️",
    ],
  },
  {
    id: "objects",
    name: "Objects",
    icon: Bell,
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "trackball",
      "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹",
      "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️",
      "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡",
      "🔋", "🪫", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸",
      "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜",
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState("smileys");
  const [search, setSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeTab);
      return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
    }
    const q = search.toLowerCase();
    // Search across all categories
    return EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) => {
      // In a real browser, search includes emojis
      return true;
    }).slice(0, 100);
  }, [search, activeTab]);

  return (
    <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
      <div className="emoji-picker-header">
        <div className="emoji-search-box">
          <Search size={14} className="emoji-search-icon" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="emoji-search-input"
            autoFocus
          />
        </div>
      </div>

      {!search && (
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
        <div className="emoji-grid">
          {filteredEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              className="emoji-btn"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
