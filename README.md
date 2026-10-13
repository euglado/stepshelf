# StepShelf

**Türkçe:** Discord toplulukları için önizlemeli kısa rehberler ve özel, adım adım okuyucu. **English:** Short server guides with a private preview and a personal step-by-step reader.

StepShelf is a real Discord Gateway bot you run on your own computer or host. This repository and its GitHub Actions do not host the bot for you. No paid service or database is required. The automated tests simulate Discord interactions; a real Discord server and token are still required for live use.

## Türkçe

### Amaç ve özellikler

Yeni üyeler, çalışma grupları ve gönüllü toplulukları için uzun mesajlar yerine 2–6 kısa adımlı rehber yayımlayın. Örneğin: karşılama kanalını bulma, kuralları okuma ve yardım isteme. Üyeler tüm rehberi kanalda görebilir veya **Adım adım oku** düğmesiyle yalnızca kendilerine görünen okuyucuyu açabilir.

- `/stepshelf`: Sunucuyu Yönet yetkili kişiler için form → özel önizleme → açık **Yayımla** veya **İptal** seçimi.
- Rehberde herkese açık başlık ve tüm adımlar; özel okuyucuda Önceki / Sonraki / Kapat düğmeleri.
- `/shelfhelp`: herkes için özel kullanım yardımı. Arayüz Discord diline göre Türkçe veya İngilizce; rehber metni otomatik çevrilmez.
- Yayımlanan rehberler Discord mesajı olarak kalır. Aynı uygulama/token ile yeniden başlatıldığında Oku düğmesi tekrar çalışır; veritabanı gerekmez.
- Bot mesaj geçmişini, diğer üyelerin mesajlarını veya sesini okumaz. DM göndermez; okundu bilgisi, ilerleme raporu, otomatik moderasyon, yapay zekâ hizmeti veya web paneli yoktur.

### Gereksinimler

Bir Discord hesabı, bot ekleyebildiğiniz sunucu, internet bağlantısı ve [Node.js 24](https://nodejs.org/en/download) gerekir. Windows, macOS ve Linux desteklenir. `node --version` çıktısı `v24...` olmalı; npm Node ile gelir. Bot çalışırken bilgisayar açık, internet bağlı ve işlem ayakta olmalıdır. Sunucuda çalışan 24 saat açık bir makine kullanabilirsiniz; canlı token veya host bu depoya dahil değildir.

### Discord Developer Portal kurulumu

1. [Developer Portal](https://discord.com/developers/applications) sayfasında **New Application** ile kendi uygulamanızı oluşturun. **General Information** içindeki **Application ID** değerini not edin; bu kimlik gizli değildir.
2. **Bot** sayfasından botu oluşturun; gerekirse **Reset Token** ile token alın. Token bir paroladır: issue, sohbet, ekran görüntüsü, komut satırı argümanı veya GitHub secret olmayan dosyaya koymayın. Yalnızca aşağıdaki gizli kurulum istemine yapıştırın. Sızarsa hemen Portal üzerinden sıfırlayın.
3. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message Content seçeneklerini **kapalı** tutun. Bot yalnızca ayrıcalıksız `Guilds` intent kullanır. Gateway bağlantısı kullandığı için **Interactions Endpoint URL** gerekmez; boş bırakın.
4. **Installation** bölümünde **Guild Install** seçin. Kurulum kapsamları `bot` ve `applications.commands`, bot izinleri yalnızca **View Channels / Kanalı Görüntüle** ve **Send Messages / Mesaj Gönder** olsun (izin toplamı **3072**). Portalın ürettiği kurulum bağlantısını açıp sunucunuzu seçin. Alternatif olarak **OAuth2 → URL Generator** altında aynı kapsam ve izinleri seçebilirsiniz. **Administrator vermeyin.** Kişisel kullanımda Public Bot seçeneğini kapalı tutabilirsiniz.
5. Discord → Kullanıcı Ayarları → Gelişmiş → **Geliştirici Modu** seçeneğini açın. Sunucu simgesine sağ tıklayıp **Sunucu Kimliğini Kopyala** seçin. Kanal kimliği veya kullanıcı kimliği yerine bu değeri kullanın.
6. Normal bir sunucu metin veya duyuru kanalında botun Kanalı Görüntüle ve Mesaj Gönder izinlerini doğrulayın. Kategori/kanal engellemeleri sunucu rollerinin izinlerini geçersiz kılabilir. Kullanıcıların uygulama komutlarını kullanabilmesi için Discord'daki **Use Application Commands** erişimine sahip olması gerekir.

### İndirme ve yapılandırma

1. Bu deponun **Code → Download ZIP** seçeneğiyle kaynakları indirin ve ZIP'i tamamen çıkarın. Ya da `git clone https://github.com/euglado/stepshelf.git` kullanın. Node.js kurduktan sonra terminali yeniden açın.
2. **Windows:** çıkardığınız klasörde `setup.cmd` dosyasını çift tıklayın. **macOS/Linux:** Terminal'de klasöre gidip `bash setup.sh` çalıştırın. Tüm sistemlerde alternatif: klasörde `npm run setup`.
3. Kurulum Application ID ve Server ID sorar; ardından tokenı **ekranda göstermeden** alır. Bazı terminallerde sağ tık veya Ctrl+Shift+V ile yapıştırın; token yazılırken yıldız bile görünmez. Ctrl+C iptal eder. Tokenı normal shell komutuna yazmayın.
4. Yardımcı `.env` dosyasını yalnızca yerel klasöre yazar, kilitli bağımlılıkları `npm ci --ignore-scripts` ile yükler ve TypeScript'i derler. Son soruya Enter ile yanıt verirseniz iki komutu seçilen sunucuya kaydeder. Kaynak kod veya JSON düzenlemeniz gerekmez.
5. Mevcut `.env` varsayılan olarak korunur. Token/sunucu kimliği değiştirmek için botu durdurun, `.env` dosyasını kendi bilgisayarınızda gizlice silin ve kurulumu tekrar çalıştırın. Mevcut token yanlışsa Portal'dan yenisini alın. `.env.example` yalnızca boş değişken adlarını gösterir.

Yapılandırma değişkenleri: `DISCORD_TOKEN` (gizli bot tokenı), `DISCORD_APPLICATION_ID` (uygulama kimliği), `DISCORD_GUILD_ID` (komutların kaydedileceği sunucu). Sunucuya özel kayıt yalnızca bu botun `/stepshelf` ve `/shelfhelp` komutlarını ekler/günceller; uygulamanın diğer komutlarını topluca silmez. Yeniden kaydetmek için `npm run register` kullanın. Botu başka sunucuya da kurarsanız o sunucunun kimliğiyle kayıt yapın; komutlar global değildir.

### Başlatma ve çalışır tutma

Windows'ta `start.cmd` dosyasını açın; macOS/Linux'ta `bash start.sh` çalıştırın. Alternatif: `npm run build` ardından `npm start`. **StepShelf hazır** mesajını bekleyin. Terminali kapatmak, bilgisayarı uyutmak veya bağlantıyı kesmek botu durdurur. Durdurmak için Ctrl+C kullanın. Helpers otomatik servis kurmaz veya bilgisayar ayarlarını değiştirmez.

24 saat kullanım için kendi güvendiğiniz hostunuzda ayrı bir işletim sistemi hesabı ve Node.js 24 kullanın. `.env` dosyasını yalnızca bu hesabın okuyabildiği klasörde tutun; ZIP'e, yedeğin herkese açık bölümüne veya Git'e eklemeyin. Linux/macOS'ta yardımcı dosyayı 0600 izinle oluşturur; Windows'ta klasör paylaşımını kapatıp dosya erişimini hesabınızla sınırlayın. Hostun kendi süreç yöneticisiyle `npm start` komutunu proje klasöründen çalıştırıp gerektiğinde yeniden başlatın. Tek bot uygulaması için **bir işlem** çalıştırın; birden fazla kopya bellek sınırlarını ve yayın bekleme süresini paylaşmaz. Güncellemeden önce botu durdurun; ardından yeni kaynakları inceleyip kurulumu, testleri ve başlatmayı tekrarlayın.

### Kullanım

1. Sunucuyu Yönet yetkili kişi normal metin veya duyuru kanalında `/stepshelf` çalıştırır.
2. 1–60 karakterlik başlık ve her biri en fazla 260 karakter olan 2–6 adım girer. Adımların **arasına boş satır** koyun. Tek satır sonu aynı adımın parçasıdır. Markdown düz metne kaçırılır; Unicode kontrol/biçim karakterleri ve gereksiz boşluklar temizlenir. Kaçış sonrası rehberin tamamı 1.800 karakteri geçemez; yoğun biçimlendirmeyi kısaltmanız gerekebilir.
3. Özel önizleme tüm metni gösterir. **Yayımla** seçilince bütün rehber aynı kanalda görünür olur. Gizli bilgi eklemeyin. İptal hiçbir mesaj yayımlamaz. Yayın anında yetki ve botun kanal izinleri yeniden kontrol edilir.
4. Üye **Adım adım oku** düğmesine basar. Sadece o üyeye görünen okuyucu açılır. Önceki/Sonraki gezinir, Kapat metni kapanış mesajıyla değiştirir. Rehberin ana mesajı değişmez.
5. Önizlemeler ve okuyucular açıldıkları andan itibaren 10 dakika geçerlidir; gezinmek süreyi uzatmaz. Yeniden başlatmada bellek oturumları kaybolur, ana rehberden tekrar açılır. Eski önizlemeden yayın yapmak yerine komutu yeniden çalıştırın.
6. Rehberi değiştirmek veya kaldırmak için yetkili kişi Discord'dan bot mesajını silip yeni rehber oluşturur. Botun düzenleme/silme komutu ve otomatik arşivleme özelliği yoktur. Duyuru kanalında mesajı takipçi sunuculara çapraz yayımlamaz.

Örnek adımlar (formun adımlar alanına):

```text
Karşılama kanalını açın ve topluluğun amacını okuyun.

Kurallar kanalını okuyun; kişisel bilgilerinizi paylaşmayın.

Sorunuz varsa bir moderatöre danışın.
```

### İzinler, güvenlik ve gizlilik

Bot izinleri yalnızca Kanalı Görüntüle + Mesaj Gönder. Administrator, Manage Messages, Manage Channels, Manage Roles, Read Message History veya Message Content intent gerekmez. Oluşturma/yayın kullanıcıdan **Sunucuyu Yönet** ister; sunucu sahibi ve Discord Administrator kullanıcıları da bu yetkiye sahiptir. Okuma için yönetici yetkisi gerekmez. Önizleme ve okuyucu kimlikleri rastgeledir ve kullanıcı/sunucu/kanala bağlıdır. Kullanıcı tarafından girilen metinde mention gönderimi ve bağlantı önizlemeleri kapalıdır. Metindeki URL'lerin güvenilirliğini bot doğrulamaz; yönetici içeriği gözden geçirmelidir.

Kalıcı yerel içerik deposu, analiz, okundu listesi veya telemetri yoktur. Taslak/okuyucu metinleri ile bunları bağlayan kullanıcı, sunucu ve kanal kimlikleri için 10 dakika; yayın bekleme kimlikleri için 60 saniye; tıklama sınırı kimlikleri için 2 saniye geçerlilik süresi vardır. Süresi dolan kayıtlar kullanılamaz; bellekten silinmeleri bir sonraki erişime veya dakikalık temizleyiciye kadar yaklaşık bir dakika daha sürebilir. Discord mesaj önbelleği kapalıdır; kütüphane bağlantı için sunucu/kanal metadata önbelleği tutar. İşlem başına en fazla 500 taslak, 500 okuyucu, 2.000 tıklama kaydı ve 500 yayın bekleme kaydı vardır. Kapasite dolunca anlaşılır genel hata alınır; biraz bekleyip tekrar deneyin. Kullanıcı başına sunucuda 2 saniyede bir işlem ve sunucuda dakikada bir yayın sınırı vardır; bunlar yeniden başlatmada sıfırlanır.

Yayımlanan rehber metni ve mesaj yazarı Discord'da mesaj silinene kadar kalır; kanalı görebilen herkes tüm metni okuyabilir ve kopyalayabilir. Ana mesajı silmek zaten açık okuyucuyu anında geri çağırmaz; oturum kapanana/süresi dolana kadar metin bellekte kalabilir. Özel yanıtlar Discord'un hizmetinde işlenir; bot Discord'un saklama politikasını değiştiremez. Bot hata loglarında token, kullanıcı metni veya ayrıntılı ağ hatası yazmaz. Discord ve host kendi bağlantı kayıtlarını tutabilir. Token yerel `.env` içinde kalır; işletim sistemi ve host güvenliği sizin sorumluluğunuzdadır.

### Sorun giderme

- **Node/npm bulunamadı:** Node.js 24 kurun; yeni terminal açın. ZIP içinden çalıştırmayın.
- **Komut görünmüyor:** Application ID ve Server ID'yi doğrulayın, botu `applications.commands` kapsamıyla sunucuya ekleyin, `npm run register` çalıştırın. Discord'u yenileyin; sunucunun Entegrasyonlar ayarlarını ve komut erişimini kontrol edin.
- **Kurulum etkileşimli terminal istiyor:** komutu gerçek terminalden veya `setup.cmd` ile çalıştırın; pipe/CI üzerinden token girmeyin.
- **Login/registration failed:** `.env` yanlış klasörde olabilir; bot tokenı yerine client secret kullanmış olabilirsiniz. Kimlikleri doğrulayıp tokenı Portal'dan sıfırlayın ve kurulumu tekrarlayın. Tokenı issue'ya göndermeyin.
- **İzin hatası:** bot rolü ve kategori/kanal engellemelerini kontrol edin. Thread, DM, forum ve ses kanalı desteklenmez. Yönetici izni vermek yerine gereken iki kanal iznini düzeltin.
- **This interaction failed / süre doldu:** bot açık mı ve internet bağlı mı kontrol edin. On dakikayı geçen veya yeniden başlatmadan önceki okuyucuyu rehberden açın. Tokenı sıfırlamak bot oturumunu keser; yeniden başlatın.
- **Yayın sırasında hata:** aynı rehberi yeniden oluşturmadan önce kanalda oluşmuş mesaj var mı bakın. Bağlantı hatası Discord mesajı kabul ettikten sonra olmuş olabilir; bot bu nedenle otomatik tekrar göndermez.
- **Hızlı işlem/kapasite:** iki saniye; yayın için bir dakika bekleyin. Yoğun kullanımda oturumların süresinin dolmasını bekleyin. Birden fazla bot işlemi çalıştırmayın.
- **Rehber bozulmuş:** yalnızca bu botun desteklenen biçimdeki mesajları okunabilir. Başka bot mesajı, taşınmış/kopyalanmış veya bozuk metin yerine yeni rehber yayımlayın.

### Testler ve katkı

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh start.sh
```

`check`, Biome lint/biçim, strict TypeScript, Node testleri ve bağımlılık lisans/kaynak/SHA-512 kilit bütünlüğü + kaynak kimlik bilgisi desen taramasını içerir. `npm audit` ayrıca güvenlik duyurularını denetler. Desen taraması her sırrı bulmayı garanti etmez. Son komut için Windows'ta Git Bash gerekir; normal kurulumda Bash gerekmez. CI Ubuntu, Windows ve macOS üzerinde aynı kontrolleri yalnızca okuma izniyle, gizli değer olmadan çalıştırır. CI botu canlı sunucuda çalıştırmaz; otomatik testler sahte etkileşimler kullanır.

Canlı kurulum sonrası elle doğrulayın: yönetici olarak önizleme/iptal/yayın, normal üye olarak özel okuma/gezinme/kapatma, izin kaldırıldıktan sonra yayın reddi ve botu yeniden başlattıktan sonra ana rehberden okuma. Bu adımlar için kendi test sunucunuzu kullanın. Katkı için [CONTRIBUTING.md](CONTRIBUTING.md), güvenlik bildirimleri için [SECURITY.md](SECURITY.md) dosyasına bakın. Lisans: [MIT](LICENSE); bağımlılıkların kendi lisansları korunur. Garanti verilmez.

## English

### Purpose and features

Publish 2–6 short steps for newcomers, study groups or volunteer communities: find the welcome channel, read the rules, ask a moderator. The complete guide remains visible in the channel. Members can also choose **Read one step at a time** to open a personal, ephemeral reader.

- `/stepshelf`: manager-only form, private preview, explicit Publish or Cancel.
- A public plain-text guide with a reader button; personal Previous/Next/Close controls.
- `/shelfhelp`: private help for everyone. UI follows the viewer's Discord locale (Turkish or English); authored guide content is never translated.
- Published guides survive restarts as Discord messages. Restarting the same bot application restores their Read buttons without a database.
- No message-history access, member-message listener, voice access, DMs, read receipts, progress reporting, moderation, AI service or web dashboard.

### Requirements

A Discord account, a server where you can install bots, internet, and [Node.js 24](https://nodejs.org/en/download) with npm. Windows, macOS and Linux are supported. Check `node --version` for `v24...`. Your computer or trusted host must stay online with the bot process running. This is self-hosted source; downloading it or running GitHub Actions does not deploy an always-on bot. No token or hosting account is included.

### Developer Portal and installation

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**. Note its **Application ID** under General Information.
2. Open **Bot**, create the bot if needed, and obtain/reset its token. Treat it as a password. Paste it only into the hidden setup prompt. Never share it in issues, screenshots, chats or command-line arguments. Reset an exposed token immediately.
3. Keep all privileged intents **off**: Presence, Server Members and Message Content. StepShelf uses only the nonprivileged `Guilds` intent. Leave **Interactions Endpoint URL** empty because the bot receives interactions through Gateway.
4. Under **Installation**, use **Guild Install**, scopes `bot` and `applications.commands`, and only **View Channels** + **Send Messages** (permission integer **3072**). Open the generated install link and select your server. OAuth2 → URL Generator with the same scopes/permissions is an alternative. Do not grant Administrator. You can keep Public Bot disabled for personal use.
5. Enable Discord User Settings → Advanced → **Developer Mode**. Right-click your server icon → **Copy Server ID**. This is different from a channel ID or your own user ID.
6. In a normal server text or announcement channel, check the bot's View Channel and Send Messages permissions including category/channel overrides. Members need Discord's **Use Application Commands** access for slash commands; guide creation also requires **Manage Server**.

Download **Code → Download ZIP** and extract it completely, or use `git clone https://github.com/euglado/stepshelf.git`. Restart your terminal after installing Node.

On **Windows**, double-click `setup.cmd` inside the extracted folder. On **macOS/Linux**, open Terminal in the folder and run `bash setup.sh`. On any system you can run `npm run setup`. The helper asks for Application ID, Server ID, then a hidden token (no characters or stars are shown). Use your terminal's paste shortcut; Ctrl+C cancels. An interactive terminal is required; do not pipe a token into the script.

The helper creates a local `.env`, installs the locked dependencies with `npm ci --ignore-scripts`, and compiles TypeScript. Press Enter at the final prompt to register commands in your server. You do not need to edit source code. Existing `.env` files are kept by default and never overwritten. To replace configuration, stop the bot, privately remove `.env` on your machine, and run setup again. `.env.example` contains empty variable names only.

Configuration variables are `DISCORD_TOKEN` (secret bot token), `DISCORD_APPLICATION_ID` (application ID), and `DISCORD_GUILD_ID` (server for command registration). `npm run register` adds/updates only this application's two named guild commands; it does not bulk-delete other commands. Commands are guild-specific. For another installed server, repeat registration with that server ID.

### Running and keeping it online

Open `start.cmd` on Windows or run `bash start.sh` on macOS/Linux. Alternatively use `npm run build` then `npm start`. Wait for **StepShelf ready**. Ctrl+C stops it. Closing the terminal, sleeping the computer or losing internet makes it unavailable. Helpers do not install a background service or alter system settings.

For continuous operation, use Node.js 24 under a separate account on a host you trust. Keep `.env` private and outside shared folders, public backups and Git. The helper creates it with mode 0600 on macOS/Linux; on Windows restrict folder/file access to your account. Use your host's process manager to run `npm start` from the project directory and restart when necessary. Run **one process per bot application**: replicas do not share in-memory limits or cooldowns. Stop before updates, review new source, then repeat setup, checks and start.

### Usage and limits

1. A person with Manage Server runs `/stepshelf` in a normal text or announcement channel.
2. Enter a 1–60-character title and 2–6 steps of at most 260 characters each. Separate steps with a **blank line**; single line breaks remain within one step. Markdown is escaped to plain text; Unicode control/format characters and redundant whitespace are cleaned. The complete escaped guide must fit 1,800 characters, so heavy formatting may need shortening.
3. Review all content in the private preview. **Publish** makes the complete guide visible to everyone who can view that channel. Never include secrets or personal data. **Cancel** publishes nothing. Manager and bot channel permissions are checked again on publication.
4. Members select Read; Previous/Next navigate privately and Close replaces their reader content with a closure message. The original public guide is unchanged. Reader controls use the viewer's language; the guide itself keeps its author's text.
5. Drafts/readers expire 10 minutes after creation; navigation does not extend expiry. Restart clears memory sessions; reopen from the public guide or recreate the draft. Published messages remain.
6. Staff edit/remove a guide by deleting its Discord message and creating a replacement. There is no edit/delete command or auto-archive. Announcement messages are not cross-published to followers.

Example steps for the form:

```text
Open the welcome channel and read about the community.

Read the rules and avoid sharing personal information.

Ask a moderator if you need help.
```

### Permissions, security and privacy

Only View Channel + Send Messages are required. No Administrator, Manage Messages/Channels/Roles, Read Message History, Message Content intent or privileged intents. Manage Server is required for creating/publishing; Discord owners/Administrators also satisfy it. Ordinary members can read. Draft/reader IDs are random and bound to the invoking user, server and channel. Mentions and link previews are disabled for supplied guide text. URLs are not verified for safety; the publishing manager must review content.

There is no local content database, analytics, read list or telemetry. Draft/reader text and associated user/server/channel IDs expire after 10 minutes; publication cooldown server IDs after 60 seconds, click limit IDs after two seconds. Expired entries cannot be used; physical removal from RAM happens on access or the minute-based cleaner, so they may linger about one further minute. Discord message caching is disabled; the library caches server/channel metadata for connectivity. Per process: at most 500 drafts, 500 readers, 2,000 click records and 500 publication cooldown records. When full, a safe generic error asks users to try again. One interaction per user/server every two seconds and one publication per server per minute; restart resets these limits.

Public guide text and the bot author remain on Discord until the message is deleted. Everyone with channel access can read/copy all steps. Deleting the original message cannot recall readers already open; their content may remain in RAM until close/expiry. Ephemeral responses are processed by Discord; this bot cannot guarantee Discord's retention or erase copied content. Application error logs exclude tokens, guide text and detailed network errors; Discord and your host may keep their own connection logs. The token stays in local `.env`; secure the operating system and host yourself.

### Troubleshooting

- **Node/npm not found:** install Node.js 24, open a new terminal, extract the ZIP before running.
- **Commands missing:** verify Application ID and Server ID, install the bot with `applications.commands`, then `npm run register`. Refresh Discord and inspect server Integrations/command access.
- **Interactive terminal required:** use a real terminal or `setup.cmd`; do not enter tokens through pipes or CI.
- **Login/registration failed:** verify the `.env` location and IDs, use the bot token rather than client secret, reset it privately in Portal and rerun setup. Never post credentials in an issue.
- **Permissions:** inspect bot role and category/channel overrides. Threads, DMs, forums and voice channels are unsupported. Fix the two needed channel permissions instead of granting Administrator.
- **Interaction failed / expired:** keep the bot running with internet; reopen expired/pre-restart readers from the guide. Restart after resetting a token.
- **Publication error:** inspect the channel before recreating the guide. Discord might have accepted the message before a network failure; the bot intentionally never retries that publication automatically.
- **Rapid clicks/capacity:** wait two seconds for clicks, one minute for another publication, or until readers expire when heavily used. Avoid multiple bot processes.
- **Unsupported guide:** only canonical messages authored by this bot are accepted. Ask a manager to recreate corrupted/copied content.

### Tests, contributions and license

Run the commands in the Turkish test section above. `npm run check` runs Biome lint/format, strict TypeScript, Node tests and dependency license/source/SHA-512 lock integrity plus source credential-pattern checks. `npm audit --audit-level=low` checks advisories separately. A pattern scan is not proof that every secret was detected. `bash -n` requires Git Bash on Windows; normal Windows setup does not need Bash. Read-only, SHA-pinned GitHub Actions runs the checks on Ubuntu, Windows and macOS without tokens. Tests mock Discord interactions; CI does not run a live bot.

After installing in your own test server, manually verify manager preview/cancel/publish, ordinary-member private reading/navigation/close, denial after removing publication permissions, and reading the same public guide after restart. Live behavior still needs your real token/server. See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions, [SECURITY.md](SECURITY.md) for private reports and [LICENSE](LICENSE) for MIT terms. Dependencies retain their own licenses; no warranty is provided.

### API references / API kaynakları

[Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [Gateway and intents](https://docs.discord.com/developers/events/gateway), [permissions](https://docs.discord.com/developers/topics/permissions), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy). StepShelf reads only its own guide message attached to a button interaction; it does not fetch channel message history.
