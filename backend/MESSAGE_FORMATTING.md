# Message Formatting System

## Overview

The Pythia Conversations chat system supports rich text formatting using markdown-style syntax. Messages can include bold text, italics, code snippets, links, mentions, and emojis with automatic parsing and validation.

## Supported Formatting

### 1. Text Formatting

#### Bold Text

```
**This text will be bold**
```

- Use double asterisks `**` around text
- Example: `Hello **world**!` → Hello **world**!

#### Italic Text

```
*This text will be italic*
```

- Use single asterisks `*` around text
- Example: `This is *important*` → This is _important_

#### Combined Formatting

```
**Bold** and *italic* together
```

- Can combine different formatting types
- Example: `**Important**: *Please read*`

### 2. Code Formatting

#### Inline Code

```
Use `console.log()` to debug
```

- Use single backticks `` ` `` around code
- Example: `The function \`getData()\` returns a promise`

#### Code Blocks

```
Here's some code:
```

function hello() {
console.log('Hello World!');
}

```

```

- Use triple backticks ``` for multi-line code
- Preserves formatting and indentation
- Great for sharing code snippets

### 3. Mentions

#### User Mentions

```
@username mentioned in message
```

- Use `@` followed by username
- Automatically notifies the mentioned user
- Example: `Hey @john, can you review this?`

### 4. Links

#### Automatic Link Detection

```
Check out https://example.com
```

- HTTP and HTTPS URLs are automatically detected
- No special syntax needed
- Example: `Visit https://github.com for more info`

### 5. Emojis

#### Text Emojis

```
Hello :wave: how are you :smile:
```

- Use `:emoji_name:` format
- Example: `Great work :thumbsup: :fire:`

## API Integration

### Message Creation with Formatting

```python
# POST /api/messages/
{
    "content": "**Important**: Please check the `config.py` file and ping @admin when done! :thumbsup:",
    "channel_id": "channel_123"
}
```

### Response with Formatting Metadata

```python
{
    "id": "msg_123",
    "content": "**Important**: Please check the `config.py` file and ping @admin when done! :thumbsup:",
    "user_id": "user_123",
    "channel_id": "channel_123",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "is_edited": false,
    "formatting": {
        "has_bold": true,
        "has_italic": false,
        "has_code": true,
        "has_code_block": false,
        "has_links": false,
        "has_mentions": true,
        "has_emojis": true,
        "link_count": 0,
        "mention_count": 1,
        "emoji_count": 1
    },
    "user": {
        "id": "user_123",
        "username": "alice",
        "email": "alice@example.com"
    }
}
```

### Formatting Validation Endpoint

```python
# POST /api/messages/format/validate
{
    "content": "**Bold** and `code` with @mention"
}

# Response
{
    "valid": true,
    "error": null,
    "formatting": {
        "has_bold": true,
        "has_italic": false,
        "has_code": true,
        "has_code_block": false,
        "has_links": false,
        "has_mentions": true,
        "has_emojis": false,
        "link_count": 0,
        "mention_count": 1,
        "emoji_count": 0
    },
    "sanitized_content": "**Bold** and `code` with @mention",
    "mentions": ["mention"]
}
```

## Validation Rules

### Syntax Validation

1. **Balanced Markers**: All formatting markers must be properly paired
   - `**bold**` ✅ Valid
   - `**bold` ❌ Invalid (unmatched)

2. **Code Block Validation**: Code blocks must be properly closed
   - ` ```code``` ` ✅ Valid
   - ` ```code ` ❌ Invalid (unclosed)

3. **Backtick Validation**: Inline code backticks must be paired
   - `` `code` `` ✅ Valid
   - `` `code `` ❌ Invalid (unmatched)

### Content Sanitization

1. **Length Limits**: Messages are limited to 2000 characters
2. **Newline Limits**: Consecutive newlines are limited to 2
3. **Space Limits**: Consecutive spaces are limited to 2
4. **Content Trimming**: Leading/trailing whitespace is removed

## WebSocket Real-time Updates

Formatted messages are broadcast in real-time with full formatting metadata:

```python
{
    "type": "new_message",
    "channel_id": "channel_123",
    "message_id": "msg_123",
    "content": "**Hello** @everyone!",
    "user_id": "user_123",
    "user_username": "alice",
    "timestamp": "2024-01-15T10:30:00Z",
    "formatting": {
        "has_bold": true,
        "has_mentions": true,
        "mention_count": 1
    }
}
```

## Frontend Integration

### Rendering Formatted Messages

The frontend should parse the formatting metadata and render accordingly:

````javascript
function renderMessage(message) {
  let content = message.content;

  // Apply formatting based on metadata
  if (message.formatting?.has_bold) {
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  if (message.formatting?.has_italic) {
    content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  if (message.formatting?.has_code) {
    content = content.replace(/`(.*?)`/g, "<code>$1</code>");
  }

  if (message.formatting?.has_code_block) {
    content = content.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
  }

  if (message.formatting?.has_mentions) {
    content = content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  if (message.formatting?.has_emojis) {
    content = content.replace(/:(\w+):/g, '<span class="emoji">:$1:</span>');
  }

  if (message.formatting?.has_links) {
    content = content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );
  }

  return content;
}
````

### Input Validation

```javascript
async function validateFormatting(content) {
  const response = await fetch("/api/messages/format/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  return await response.json();
}
```

## Testing

### Running Format Tests

```bash
# Run automated tests
cd backend
python scripts/test_formatting.py

# Run interactive testing
python scripts/test_formatting.py --interactive
```

### Test Examples

The test suite includes validation for:

- Valid formatting combinations
- Invalid syntax detection
- Content sanitization
- Mention extraction
- Link detection
- Emoji parsing

## Error Handling

### Common Validation Errors

1. **Unmatched Bold Markers**

   ````
   Error: "Invalid formatting syntax. Check your bold (**), code (`), and code block (```) markers."
   Content: "**bold but not closed"
   ````

2. **Unclosed Code Blocks**

   ````
   Error: "Invalid formatting syntax. Check your bold (**), code (`), and code block (```) markers."
   Content: "```\nunclosed code block"
   ````

3. **Content Too Long**
   ```
   Error: "Message content must be less than 2000 characters"
   ```

### Error Response Format

````python
{
    "valid": false,
    "error": "Invalid formatting syntax. Check your bold (**), code (`), and code block (```) markers.",
    "formatting": null,
    "sanitized_content": null
}
````

## Performance Considerations

1. **Regex Optimization**: Formatting patterns use compiled regex for performance
2. **Lazy Parsing**: Formatting metadata is only generated when needed
3. **Caching**: Consider caching parsed formatting for frequently accessed messages
4. **Batch Processing**: Multiple messages can be processed efficiently

## Security

1. **Content Sanitization**: All user input is sanitized before storage
2. **XSS Prevention**: Frontend must properly escape HTML when rendering
3. **Link Validation**: Consider validating/filtering URLs for security
4. **Mention Validation**: Only valid usernames can be mentioned

## Future Enhancements

Potential additions to the formatting system:

1. **Tables**: Markdown-style table support
2. **Lists**: Ordered and unordered list formatting
3. **Quotes**: Block quote formatting with `>`
4. **Strikethrough**: Text strikethrough with `~~text~~`
5. **Custom Emojis**: Support for custom emoji uploads
6. **Rich Embeds**: URL preview cards and rich media
7. **LaTeX**: Mathematical expression support
8. **Syntax Highlighting**: Language-specific code highlighting
