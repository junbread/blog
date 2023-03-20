---
title: "VS Code"
date: 2021-01-09
tags: ["Tips", "Editor"]
---

마이크로소프트에서 개발한 강력한 텍스트 에디터. Electron 기반으로 만들어졌다. 

### 사용하고 있는 플러그인

#### [Shell launcher](https://marketplace.visualstudio.com/items?itemName=Tyriar.shell-launcher)

![https://user-images.githubusercontent.com/5761789/85945787-f8d3cc00-b97a-11ea-8fd5-a4c7196eadf4.png](https://user-images.githubusercontent.com/5761789/85945787-f8d3cc00-b97a-11ea-8fd5-a4c7196eadf4.png)

VS Code에 임베드되어 있는 터미널 패널은 기본 셸 환경을 바꿀 수 있도록 되어 있지만, 상황별로 다른 셸을 사용하고자 할 때는 불편하다. `Shell launcher` 플러그인은 현재 설치되어 있는 셸을 자동으로 인식해 리스트에 표시해 준다. 간단하지만 편리하다.

#### [Render Line Endings](https://marketplace.visualstudio.com/items?itemName=medo64.render-crlf)

Windows 머신에 [WSL](https://junbread.win/wiki/WSL)을 설치해 사용하고 있다. 한 가지 문제는 Windows와 Linux의 EOL 처리가 서로 달라서 충돌이 일어나는 경우가 있다는 것이다. `CRLF`로 처리된 셸 스크립트 파일을 WSL 환경에서 실행할 경우 오류가 일어나거나, Git에서 파일 내용은 변경되지 않았는데 `CR`이 추가되어 변경된 파일로 표시된다거나 하는 다양한 문제가 있다. VS Code는 기본적으로 EOL을 인식해서 오른쪽 하단에 표시해 주지만, 개별 문자는 표시하지 않는다. 이 플러그인을 설치하면 `CRLF`와 `LF`을 렌더링해 주기 때문에 편리하게 디버깅이 가능하다.

#### [vscode-pdf](https://marketplace.visualstudio.com/items?itemName=tomoki1207.pdf)

VS Code에서 PDF를 볼 수 있는 플러그인. PDF 뷰어를 별도로 띄우고 싶지 않을 때 유용하다.

재시작했을 때 뷰가 다시 로드되지 않는 단점이 있다.