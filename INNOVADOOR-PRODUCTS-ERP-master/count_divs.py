import sys

filename = "frontend/src/pages/production/ViewParty.tsx"
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

opens = 0
closes = 0
for i, line in enumerate(lines):
    opens += line.count("<div")
    closes += line.count("</div")
    # Also count self-closing <div ... />
    self_closings = line.count("<div />") + line.count("<div/>") # Simple check
    # But usually <div /> is not used much.
    
print(f"Total <div: {opens}")
print(f"Total </div: {closes}")
