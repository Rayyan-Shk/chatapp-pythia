#!/usr/bin/env python3
"""
Test script for message formatting functionality
Run this to test the formatting parser and validator
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.message import MessageFormatter

def test_formatting():
    """Test various formatting scenarios"""
    
    test_cases = [
        {
            "name": "Bold text",
            "content": "This is **bold text** and this is normal",
            "expected_valid": True
        },
        {
            "name": "Italic text", 
            "content": "This is *italic text* and this is normal",
            "expected_valid": True
        },
        {
            "name": "Code inline",
            "content": "Use `console.log()` to debug",
            "expected_valid": True
        },
        {
            "name": "Code block",
            "content": "Here's some code:\n```\nfunction hello() {\n  console.log('Hello!');\n}\n```",
            "expected_valid": True
        },
        {
            "name": "Mixed formatting",
            "content": "**Bold** and *italic* with `code` and @username mention",
            "expected_valid": True
        },
        {
            "name": "Links",
            "content": "Check out https://example.com and https://github.com",
            "expected_valid": True
        },
        {
            "name": "Emojis",
            "content": "Hello :wave: how are you :smile:",
            "expected_valid": True
        },
        {
            "name": "Invalid bold (unmatched)",
            "content": "This is **bold but not closed",
            "expected_valid": False
        },
        {
            "name": "Invalid code block (unmatched)",
            "content": "```\nunclosed code block",
            "expected_valid": False
        },
        {
            "name": "Invalid backticks (unmatched)",
            "content": "This has `unmatched backtick",
            "expected_valid": False
        },
        {
            "name": "Complex valid formatting",
            "content": "**Important**: Check the `config.py` file and update the database URL. Also ping @admin when done. :thumbsup:",
            "expected_valid": True
        }
    ]
    
    print("🧪 Testing Message Formatting\n")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. {test['name']}")
        print(f"Content: {test['content']}")
        print("-" * 40)
        
        # Test validation
        is_valid = MessageFormatter.validate_formatting(test['content'])
        validation_passed = is_valid == test['expected_valid']
        
        if validation_passed:
            print(f"✅ Validation: {'Valid' if is_valid else 'Invalid'} (Expected)")
            passed += 1
        else:
            print(f"❌ Validation: {'Valid' if is_valid else 'Invalid'} (Expected: {'Valid' if test['expected_valid'] else 'Invalid'})")
            failed += 1
        
        if is_valid:
            # Test parsing
            try:
                sanitized = MessageFormatter.sanitize_content(test['content'])
                formatting = MessageFormatter.parse_formatting(sanitized)
                mentions = MessageFormatter.extract_mentions(sanitized)
                
                print(f"📝 Sanitized: {sanitized}")
                print(f"🎨 Formatting:")
                print(f"   - Bold: {formatting.has_bold}")
                print(f"   - Italic: {formatting.has_italic}")
                print(f"   - Code: {formatting.has_code}")
                print(f"   - Code blocks: {formatting.has_code_block}")
                print(f"   - Links: {formatting.has_links} ({formatting.link_count})")
                print(f"   - Mentions: {formatting.has_mentions} ({formatting.mention_count})")
                print(f"   - Emojis: {formatting.has_emojis} ({formatting.emoji_count})")
                
                if mentions:
                    print(f"👤 Mentioned users: {', '.join(mentions)}")
                    
            except Exception as e:
                print(f"❌ Parsing error: {e}")
                failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️  {failed} tests failed")
    
    return failed == 0


def interactive_test():
    """Interactive testing mode"""
    print("\n🎮 Interactive Formatting Test")
    print("Enter messages to test formatting (type 'quit' to exit):")
    print("=" * 60)
    
    while True:
        try:
            content = input("\nMessage: ").strip()
            
            if content.lower() in ['quit', 'exit', 'q']:
                break
                
            if not content:
                continue
            
            print("-" * 40)
            
            # Validate
            is_valid = MessageFormatter.validate_formatting(content)
            print(f"Valid: {'✅ Yes' if is_valid else '❌ No'}")
            
            if is_valid:
                # Parse and display
                sanitized = MessageFormatter.sanitize_content(content)
                formatting = MessageFormatter.parse_formatting(sanitized)
                mentions = MessageFormatter.extract_mentions(sanitized)
                
                if sanitized != content:
                    print(f"Sanitized: {sanitized}")
                
                features = []
                if formatting.has_bold: features.append("Bold")
                if formatting.has_italic: features.append("Italic") 
                if formatting.has_code: features.append("Code")
                if formatting.has_code_block: features.append("Code blocks")
                if formatting.has_links: features.append(f"Links ({formatting.link_count})")
                if formatting.has_mentions: features.append(f"Mentions ({formatting.mention_count})")
                if formatting.has_emojis: features.append(f"Emojis ({formatting.emoji_count})")
                
                if features:
                    print(f"Features: {', '.join(features)}")
                else:
                    print("Features: Plain text")
                
                if mentions:
                    print(f"Mentioned: @{', @'.join(mentions)}")
            else:
                print("❌ Invalid formatting syntax")
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n👋 Goodbye!")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        interactive_test()
    else:
        test_formatting() 