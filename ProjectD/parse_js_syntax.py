from pathlib import Path
p = Path(r'e:\Game Development\Blockbound---Gamejam-2026\ProjectD\Machine.html')
text = p.read_text(encoding='utf-8')
script_start = text.find('<script>')
script_end = text.find('</script>', script_start)
script = text[script_start + len('<script>'):script_end]
print('script len', len(script))
# simple delimiter count
print('brace diff', script.count('{') - script.count('}'))
print('paren diff', script.count('(') - script.count(')'))
print('bracket diff', script.count('[') - script.count(']'))
# bracket stack ignoring strings
stack = []
line = 1
col = 0
in_s = None
esc = False
for ch in script:
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        continue
    if in_s:
        if esc:
            esc = False
        elif ch == '\\':
            esc = True
        elif ch == in_s:
            in_s = None
        continue
    if ch in '"\'`':
        in_s = ch
        continue
    if ch in '{[(':
        stack.append((ch, line, col))
    elif ch in '}])':
        if not stack:
            print('unmatched closing', ch, line, col)
            break
        o, ol, oc = stack.pop()
        if (o == '{' and ch != '}') or (o == '[' and ch != ']') or (o == '(' and ch != ')'):
            print('mismatch', o, ol, oc, 'vs', ch, line, col)
            break
else:
    if stack:
        print('unclosed', stack[-1])
    else:
        print('balanced')
