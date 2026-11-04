#!/bin/bash
# 重建整份 PPT 到指定文件（默认 v3），避免预览面板锁住旧文件
cd "/c/Users/Yanzongning/Desktop/童健韶华资料库/班级宣讲/新生体质健康宣讲" || exit 1
export SWC_NATIVE_BINDING_CACHE="C:\\ProgramData\\swc-cache"

OUT="${1:-新生体质健康宣讲_v3.pptx}"
python -c "
import os
try: os.remove(r'$OUT')
except: pass
"

slidep create "$OUT" > /dev/null 2>&1 || { echo "create failed"; exit 1; }

CNT=0
FAIL=0
for f in $(ls slides/*.slide | sort); do
  UP=$(slidep upsert-dsl "$OUT" --dsl-file "$f" 2>&1 | grep -E '^\{"ok"' | tail -1)
  if echo "$UP" | grep -q '"ok":true'; then
    LINT=$(slidep lint "$OUT" --dsl-file "$f" --page-index "$CNT" 2>&1 | grep -E '^\{"ok"' | tail -1)
    if echo "$LINT" | grep -q '"ok":true'; then
      echo "OK   $f  idx=$CNT"
    else
      echo "WARN $f  idx=$CNT  $LINT"
      FAIL=$((FAIL+1))
    fi
  else
    echo "FAIL $f  $UP"
    FAIL=$((FAIL+1))
  fi
  CNT=$((CNT+1))
done
echo "---- 共 $CNT 页，异常 $FAIL 页 -> $OUT ----"
ls -la "$OUT"
