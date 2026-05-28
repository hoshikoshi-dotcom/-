# 電子野帳 (水準測量) - 個人用PWA

iPhone Safariで動作する**音声入力対応**の電子野帳アプリです。
水準測量(BS/IH/FS/GL)の入力・自動計算・Excel(.xlsx)出力に対応しています。

## ファイル構成

```
index.html              ── メインHTML
app.js                  ── ロジック (音声入力・計算・Excel出力)
sw.js                   ── Service Worker (オフライン対応)
manifest.json           ── PWAマニフェスト
icon.svg                ── アプリアイコン (ベクター)
icon-192.png            ── PWA用アイコン
icon-512.png            ── PWA用アイコン
apple-touch-icon.png    ── iOSホーム画面用アイコン (180x180)
```

## 機能

- 水準野帳形式の入力 (BS / IH / FS / GL)
- 自動計算: `IH = 直前GL + BS`、`GL = IH - FS`
- BM(基準点)複数登録対応・もりかえ点(TP)自動判定
- 音声入力 (BS/FSセル横の🎤ボタン、日本語認識)
- Excel(.xlsx)エクスポート (合計・差欄付き)
- 自動保存 (端末ローカル, localStorage)
- オフライン動作 (Service Worker)
- iPhoneホーム画面に追加してネイティブアプリ風に使用可能

## 公開手順 (個人用)

PWAは **HTTPS** での配信が必要です(localhost を除く)。
無料で公開する代表的な方法を3つ紹介します。

### 方法1: GitHub Pages (推奨・完全無料)

1. GitHubアカウントを作成 (無料)
2. 新規リポジトリを作成 (例: `level-survey`、Public)
3. このフォルダ内の全ファイルをアップロード
   - GitHubのWeb画面で「Add file」→「Upload files」からドラッグ&ドロップでOK
4. リポジトリの **Settings → Pages** を開く
5. 「Source」を `Deploy from a branch` → `main` / `(root)` に設定して保存
6. 数十秒後に `https://<ユーザー名>.github.io/level-survey/` で公開される
7. iPhoneのSafariでこのURLを開く

### 方法2: Netlify Drop (アカウント不要・最速)

1. https://app.netlify.com/drop を開く
2. このフォルダ全体をドラッグ&ドロップ
3. 即座に `https://xxxxx.netlify.app` のURLが発行される
4. iPhoneのSafariでこのURLを開く

※ 無料・無期限で動作しますが、URLは長くなります。

### 方法3: Cloudflare Pages

1. https://pages.cloudflare.com で「Direct Upload」を選択
2. フォルダをアップロード
3. `https://xxxxx.pages.dev` で公開

## iPhoneホーム画面への追加

1. Safariで上記URLを開く
2. 下部の **共有ボタン** (□に↑) をタップ
3. **「ホーム画面に追加」** を選択
4. 名称を確認して「追加」

ホーム画面のアイコンから起動するとフルスクリーン表示になり、ネイティブアプリのように使えます。

## 音声入力の使い方

1. 各セル右側の 🎤 ボタンをタップ
2. 初回はマイクの使用許可を「許可」する
3. 例えば「いってんにいさんよん」「1点234」「1.234」のいずれでも `1.234` と認識
4. 認識結果を確認して「確定」

### 対応する発話例

| 発話 | 入力される値 |
|---|---|
| 1.234 | 1.234 |
| いってんにさんよん | 1.234 |
| 1点234 | 1.234 |
| 零点八二三 | 0.823 |
| 1メートル234 | 1.234 |

## 入力ルール (水準測量野帳)

| 行の種類 | BS | FS | 動作 |
|---|---|---|---|
| 出発点 (BM) | ○ | × | IH = 既知標高 + BS |
| 中間点 (IP) | × | ○ | GL = IH - FS  (IHは引継ぎ) |
| もりかえ点 (TP) | ○ | ○ | GL = IH - FS、新IH = GL + BS |
| 終点 | × | ○ | GL = IH - FS |

## Excel出力フォーマット

```
水準測量野帳
プロジェクト: ○○路線    日付: 2026/05/03

No  基準点/測点  BS    IH     FS    GL     備考
BM  BM-1        1.234 11.234        10.000
1   1                              0.823  10.411
2   2(TP)       1.456 11.643 1.234  10.187
...
合計           XXXXX        XXXXX
差(BS-FS)      XXXXX
```

## トラブルシューティング

- **音声入力が動かない**: iOS 14.5以降のSafari、もしくはAndroid Chromeで動作。プライベートブラウズでは使えません
- **マイクが反応しない**: iPhoneの 設定 → Safari → マイク → 許可 を確認
- **オフライン使用したい**: 一度オンラインで開けばService Workerがキャッシュするので、以降はオフラインでもOK
- **データが消えた**: localStorage保存のため、Safariの履歴/データ削除でクリアされます。重要なデータは都度Excel出力を

## ライセンス

個人利用フリー (内製ツール)
