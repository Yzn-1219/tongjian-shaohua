#!/bin/bash
# 在 05 之后插入两页：原 06-25 顺延为 08-27，页脚数字同步更新
cd "/c/Users/Yanzongning/Desktop/童健韶华资料库/班级宣讲/新生体质健康宣讲" || exit 1

for i in $(seq 25 -1 6); do
  old=$(printf "%02d" $i)
  new=$(printf "%02d" $((i + 2)))
  if [ -f "slides/$old.slide" ]; then
    mv "slides/$old.slide" "slides/$new.slide"
    sed -i "s/color: '#CBD5E1' }}>$old</color: '#CBD5E1' }}>$new</" "slides/$new.slide"
  fi
done

echo "重命名完成，现有文件："
ls slides | sort
