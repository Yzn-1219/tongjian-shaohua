#!/bin/bash
# 逐页写入并检查：./build.sh slides/02.slide slides/03.slide ...
cd "/c/Users/Yanzongning/Desktop/童健韶华资料库/班级宣讲/新生体质健康宣讲" || exit 1
export SWC_NATIVE_BINDING_CACHE="C:\\ProgramData\\swc-cache"
CNT=$(cat .pagecount 2>/dev/null || echo 1)
for f in "$@"; do
  UP=$(slidep upsert-dsl "新生体质健康宣讲.pptx" --dsl-file "$f" 2>&1 | grep -E '^\{"ok"' | tail -1)
  if echo "$UP" | grep -q '"ok":true'; then
    LINT=$(slidep lint "新生体质健康宣讲.pptx" --dsl-file "$f" --page-index "$CNT" 2>&1 | grep -E '^\{"ok"' | tail -1)
    echo "[$f idx=$CNT] $LINT"
    CNT=$((CNT+1))
    echo $CNT > .pagecount
  else
    echo "[$f] UPSERT FAILED: $UP"
  fi
done
echo "next_index=$CNT"
