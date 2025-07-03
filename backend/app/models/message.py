from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator, Field
import re
from .user import User


class MessageFormatting(BaseModel):
    """Message formatting metadata"""
    has_bold: bool = False
    has_italic: bool = False
    has_code: bool = False
    has_code_block: bool = False
    has_links: bool = False
    has_mentions: bool = False
    has_emojis: bool = False
    link_count: int = 0
    mention_count: int = 0
    emoji_count: int = 0


class MessageBase(BaseModel):
    content: str
    
    @validator('content')
    def validate_content(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty")
        if len(v) > 2000:  # Increased limit for formatted messages
            raise ValueError("Message content must be less than 2000 characters")
        return v.strip()


class MessageCreate(MessageBase):
    channel_id: str


class MessageUpdate(BaseModel):
    content: str  # Required for editing
    
    @validator('content')
    def validate_content(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty")
        if len(v) > 2000:
            raise ValueError("Message content must be less than 2000 characters")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Updated message with **bold**, *italic*, `code`, and @username mention"
            }
        }


class Message(MessageBase):
    id: str
    user_id: str = Field(alias="userId")
    channel_id: str = Field(alias="channelId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    is_edited: bool = Field(default=False, alias="isEdited")
    formatting: Optional[MessageFormatting] = None  # Rich formatting metadata
    
    class Config:
        from_attributes = True
        populate_by_name = True


class MessageWithUser(Message):
    user: User


class MessageReactionBase(BaseModel):
    emoji: str


class MessageReaction(MessageReactionBase):
    id: str
    user_id: str = Field(alias="userId")
    message_id: str = Field(alias="messageId")
    created_at: datetime = Field(alias="createdAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class MessageReactionWithUser(MessageReaction):
    user: User


class MessageWithDetails(MessageWithUser):
    reactions: List[MessageReactionWithUser] = []
    mention_count: int = 0


class TypingIndicator(BaseModel):
    user_id: str
    username: str
    channel_id: str
    is_typing: bool


class CreateReactionRequest(BaseModel):
    message_id: str
    emoji: str


# Formatting utilities
class MessageFormatter:
    """Utility class for parsing and validating message formatting"""
    
    # Regex patterns for different formatting types
    BOLD_PATTERN = re.compile(r'\*\*([^*]+)\*\*')
    ITALIC_PATTERN = re.compile(r'\*([^*]+)\*')
    CODE_PATTERN = re.compile(r'`([^`]+)`')
    CODE_BLOCK_PATTERN = re.compile(r'```([^`]+)```')
    LINK_PATTERN = re.compile(r'https?://[^\s]+')
    MENTION_PATTERN = re.compile(r'@(\w+)')
    EMOJI_PATTERN = re.compile(r':(\w+):')
    
    @classmethod
    def parse_formatting(cls, content: str) -> MessageFormatting:
        """Parse message content and extract formatting metadata"""
        
        bold_matches = cls.BOLD_PATTERN.findall(content)
        italic_matches = cls.ITALIC_PATTERN.findall(content)
        code_matches = cls.CODE_PATTERN.findall(content)
        code_block_matches = cls.CODE_BLOCK_PATTERN.findall(content)
        link_matches = cls.LINK_PATTERN.findall(content)
        mention_matches = cls.MENTION_PATTERN.findall(content)
        emoji_matches = cls.EMOJI_PATTERN.findall(content)
        
        return MessageFormatting(
            has_bold=len(bold_matches) > 0,
            has_italic=len(italic_matches) > 0,
            has_code=len(code_matches) > 0,
            has_code_block=len(code_block_matches) > 0,
            has_links=len(link_matches) > 0,
            has_mentions=len(mention_matches) > 0,
            has_emojis=len(emoji_matches) > 0,
            link_count=len(link_matches),
            mention_count=len(mention_matches),
            emoji_count=len(emoji_matches)
        )
    
    @classmethod
    def extract_mentions(cls, content: str) -> List[str]:
        """Extract mentioned usernames from message content"""
        return cls.MENTION_PATTERN.findall(content)
    
    @classmethod
    def sanitize_content(cls, content: str) -> str:
        """Sanitize message content while preserving formatting"""
        # Remove potentially harmful content while keeping formatting
        # This is a basic implementation - expand as needed
        content = content.strip()
        
        # Limit consecutive newlines
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Limit consecutive spaces
        content = re.sub(r' {3,}', '  ', content)
        
        return content
    
    @classmethod
    def validate_formatting(cls, content: str) -> bool:
        """Validate that formatting syntax is correct"""
        try:
            # Check for unmatched formatting markers
            bold_count = content.count('**')
            if bold_count % 2 != 0:
                return False
                
            # Check for unmatched code blocks
            code_block_count = content.count('```')
            if code_block_count % 2 != 0:
                return False
                
            # Check for unmatched single backticks (excluding code blocks)
            content_without_blocks = cls.CODE_BLOCK_PATTERN.sub('', content)
            single_backtick_count = content_without_blocks.count('`')
            if single_backtick_count % 2 != 0:
                return False
                
            return True
        except Exception:
            return False 