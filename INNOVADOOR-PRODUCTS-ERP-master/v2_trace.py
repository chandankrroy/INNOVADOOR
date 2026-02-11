import re
import sys

def trace(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    print(f"File has {len(lines)} lines.")
    for i, line in enumerate(lines):
        line_num = i + 1
        # Find all tags
        # We only care about div, main, table, tbody, tr, td
        tags = re.findall(r'<(div|main|table|tbody|tr|td)|</(div|main|table|tbody|tr|td)', line)
        for tag_open, tag_close in tags:
            if tag_open:
                stack.append((tag_open, line_num))
            elif tag_close:
                if not stack:
                    print(f"L{line_num}: Unexpected closing </{tag_close}>")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_close:
                        print(f"L{line_num}: Mismatch </{tag_close}> expected </{last_tag}> (from L{last_line})")
    
    if stack:
        print("Unclosed tags:")
        for tag, line in stack:
            print(f"  <{tag}> from L{line}")
    else:
        print("Balanced tags (div, main, table, tbody, tr, td).")

if __name__ == "__main__":
    trace(sys.argv[1])
