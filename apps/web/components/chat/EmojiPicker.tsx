"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

// Emoji categories with common emojis
const emojiCategories = {
  recent: {
    name: "Recently Used",
    emojis: ["😀", "😂", "❤️", "👍", "👎", "😊", "🎉", "🔥"],
  },
  people: {
    name: "Smileys & People",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
      "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
      "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
      "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
      "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
      "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
      "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥",
      "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧",
      "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
      "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑",
      "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻",
      "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸",
      "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
    ],
  },
  nature: {
    name: "Animals & Nature",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
      "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
      "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
      "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
      "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎",
      "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡",
      "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅",
      "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪",
      "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖",
      "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮",
      "🐕‍🦺", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩",
      "🕊️", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁",
      "🐀", "🐿️", "🦔"
    ],
  },
  food: {
    name: "Food & Drink",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
      "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
      "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑",
      "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐",
      "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈",
      "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭",
      "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮",
      "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝", "🍜",
      "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙",
      "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧",
      "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭",
      "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯"
    ],
  },
  activity: {
    name: "Activities",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
      "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
      "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿",
      "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿",
      "⛷️", "🏂", "🪂", "🏋️‍♀️", "🏋️", "🏋️‍♂️", "🤼‍♀️", "🤼",
      "🤼‍♂️", "🤸‍♀️", "🤸", "🤸‍♂️", "⛹️‍♀️", "⛹️", "⛹️‍♂️", "🤺",
      "🤾‍♀️", "🤾", "🤾‍♂️", "🏌️‍♀️", "🏌️", "🏌️‍♂️", "🏇", "🧘‍♀️",
      "🧘", "🧘‍♂️", "🏄‍♀️", "🏄", "🏄‍♂️", "🏊‍♀️", "🏊", "🏊‍♂️",
      "🤽‍♀️", "🤽", "🤽‍♂️", "🚣‍♀️", "🚣", "🚣‍♂️", "🧗‍♀️", "🧗",
      "🧗‍♂️", "🚵‍♀️", "🚵", "🚵‍♂️", "🚴‍♀️", "🚴", "🚴‍♂️", "🏆",
      "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫",
      "🎟️", "🎪", "🤹", "🤹‍♀️", "🤹‍♂️", "🎭", "🩰", "🎨",
      "🎬", "🎤", "🎧", "🎼", "🎵", "🎶", "🥇", "🎯",
      "🎲", "🎮", "🎳"
    ],
  },
  objects: {
    name: "Objects",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️",
      "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼",
      "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️",
      "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
      "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋",
      "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸",
      "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎",
      "⚖️", "🪜", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️",
      "🪓", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲",
      "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️",
      "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿", "🧿",
      "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊",
      "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹",
      "🪠", "🧽", "🧴", "🛎️", "🔑", "🗝️", "🚪", "🪑",
      "🛋️", "🛏️", "🛌", "🧸", "🪆", "🖼️", "🪞", "🪟",
      "🛍️", "🛒", "🎁", "🎈", "🎏", "🎀", "🪄", "🪅",
      "🎊", "🎉", "🎎", "🏮", "🎐", "🧧"
    ],
  },
  symbols: {
    name: "Symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
      "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
      "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
      "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️",
      "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️",
      "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹",
      "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌",
      "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️",
      "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗",
      "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️",
      "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯",
      "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀",
      "💤", "🏧", "🚾", "♿", "🅿️", "🛗", "🈳", "🈂️",
      "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧️",
      "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤",
      "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓",
      "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣",
      "8️⃣", "9️⃣", "🔟"
    ],
  },
};

export const EmojiPicker = ({ 
  onEmojiSelect, 
  trigger, 
  className 
}: EmojiPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pythia-recent-emojis");
      return saved ? JSON.parse(saved) : emojiCategories.recent.emojis;
    }
    return emojiCategories.recent.emojis;
  });

  const handleEmojiClick = (emoji: string) => {
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(newRecent);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("pythia-recent-emojis", JSON.stringify(newRecent));
    }
    
    onEmojiSelect(emoji);
  };

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => 
          // Simple search - you could enhance this with emoji names/descriptions
          emoji.includes(searchTerm.toLowerCase())
        )
    : activeCategory === "recent" 
      ? recentEmojis 
      : emojiCategories[activeCategory as keyof typeof emojiCategories]?.emojis || [];

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", className)}>
      <Smile className="h-4 w-4" />
    </Button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex flex-col h-96">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emojis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Categories */}
          {!searchTerm && (
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
              <TabsList className="grid w-full grid-cols-6 h-10 p-1 m-2">
                <TabsTrigger value="recent" className="text-xs p-1">😀</TabsTrigger>
                <TabsTrigger value="people" className="text-xs p-1">😊</TabsTrigger>
                <TabsTrigger value="nature" className="text-xs p-1">🐶</TabsTrigger>
                <TabsTrigger value="food" className="text-xs p-1">🍎</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs p-1">⚽</TabsTrigger>
                <TabsTrigger value="objects" className="text-xs p-1">📱</TabsTrigger>
              </TabsList>

              {Object.entries(emojiCategories).map(([key, category]) => (
                <TabsContent key={key} value={key} className="flex-1 m-0">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-8 gap-1 p-3">
                      {(key === "recent" ? recentEmojis : category.emojis).map((emoji, index) => (
                        <Button
                          key={`${emoji}-${index}`}
                          variant="ghost"
                          className="h-8 w-8 p-0 text-lg hover:bg-muted"
                          onClick={() => handleEmojiClick(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Search Results */}
          {searchTerm && (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-8 gap-1 p-3">
                {filteredEmojis.map((emoji, index) => (
                  <Button
                    key={`${emoji}-${index}`}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-lg hover:bg-muted"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              {filteredEmojis.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No emojis found
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}; 