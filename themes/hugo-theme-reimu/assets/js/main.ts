window.throttle = (func: (...args: any[]) => void, limit: number) => {
  let lastFunc: number | undefined, lastRan: number;

  return (...args) => {
    const context = this;
    if (!lastRan || Date.now() - lastRan >= limit) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        () => {
          func.apply(context, args);
          lastRan = Date.now();
        },
        limit - (Date.now() - lastRan),
      );
    }
  };
};

(function () {
  // A Simple EventListener
  [Element, Document, Window].forEach((target) => {
    target.prototype._addEventListener = target.prototype
      .addEventListener as any;
    target.prototype._removeEventListener = target.prototype
      .removeEventListener as any;
    target.prototype.addEventListener = target.prototype.on = function (
      name: any,
      listener: any,
      options: any,
    ) {
      this.__listeners__ = this.__listeners__ || {};
      this.__listeners__[name] = this.__listeners__[name] || [];

      // Check if the listener is already added
      for (let [l, o] of this.__listeners__[name]) {
        if (l === listener && JSON.stringify(o) === JSON.stringify(options)) {
          return this; // Listener is already added, do nothing
        }
      }
      this.__listeners__[name].push([listener, options]);
      this._addEventListener(name, listener, options);
      return this;
    };
    target.prototype.removeEventListener = target.prototype.off = function (
      name: any,
      listener: any,
      options: any,
    ) {
      if (!this.__listeners__ || !this.__listeners__[name]) {
        return this;
      }
      if (!listener) {
        // remove all event listeners
        this.__listeners__[name].forEach(([listener, options]) => {
          this.removeEventListener(name, listener, options);
        });
        delete this.__listeners__[name];
        return this;
      }
      this._removeEventListener(name, listener, options);
      this.__listeners__[name] = this.__listeners__[name].filter(
        ([l, o]) =>
          l !== listener || JSON.stringify(o) !== JSON.stringify(options),
      );
      if (this.__listeners__[name].length === 0) {
        delete this.__listeners__[name];
      }
      return this;
    };
  });
  // Simple Selector
  window._$ = (selector: string) => document.querySelector(selector);
  window._$$ = (selector: string) => document.querySelectorAll(selector);

  // Simplified / Traditional Chinese toggle
  const zhConvertButton = document.createElement("button");
  const isModernChinese = document.documentElement.lang
    .toLowerCase()
    .startsWith("zh");
  const simplified =
    "万与丑专业丛东丝丢两严丧个丰临为丽举么义乌乐乔习乡书买乱争于亏云亚产亩亲亵亸亿仅从仑仓仪们价众优伙会伞伟传伤伦伪伫体余佣佥侠侣侥侦侧侨侩侪侬俣俦俨俩俪俭债倾偬偻偾偿傥傧储傩儿兑兖党兰关兴兹养兽冁内冈册写军农冢冯冲决况冻净凄准凉减凑凛几凤凫凭凯击凿刍划刘则刚创删别刬刭刹刽刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勐勚匀匦匮区医华协单卖卢卤卧卫却卺厂厅历厉压厌厍厕厢厣厦厨厩厮县参叁双发变叙叠叶号叹叽吁后吓吕吗吣吨听启吴呐呒呓呕呖呗员呙呛呜咏咙咛咝咤响哑哒哓哔哕哗哙哜哝哟唛唝唠唡唢唤啧啬啭啮啰啴啸喷喽喾嗫嗳嘘嘤嘱噜嚣团园囱围囵国图圆圣圹场坂坏块坚坛坜坝坞坟坠垄垅垆垒垦垩垫垭垱垲垴埘埙埚埯堑堕塆墙壮声壳壶处备复够头夸夹夺奁奂奋奖奥妆妇妈妩妪妫姗姜娄娅娆娇娈娱娲娴婳婴婵婶媪嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尝尧尴尸尽层屃屉届属屡屦屿岁岂岖岗岘岙岚岛岭岳岽岿峃峄峡峣峤峥峦崂崃崄崭嵘嵚嵝巅巩巯币帅师帏帐帘帜带帧帮帱帻帼幂庄庆庐庑库应庙庞废庼廪开异弃张弥弦弯弹强归当录彦彻径徕忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恳恶恸恹恺恻恼恽悦悫悬悭悯惊惧惨惩惫惬惭惮惯愠愤愦愿慑懑懒懔戆戋戏戗战戬户扎扑执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挜挝挞挟挠挡挢挣挤挥挦捞损捡换捣据捻掳掴掷掸掺掼揽揿搀搁搂搅携摄摅摆摇摈摊撄撑撵撷撸撺擞攒敌敛数斋斓斗斩断无旧时旷旸昙昼显晋晒晓晔晕晖暂暖暗术机杀杂权条来杨杩杰极构枞枢枣枥枧枨枪枫枭柜柠柽栀栅标栈栉栊栋栌栎栏树栖样栾桊桠桡桢档桤桥桦桧桨桩梦梼梾梿检棁棂椁椟椠椤椭楼榄榅榇榈榉槚槛槟槠横樯樱橥橱橹橼檩欢欤欧欲歼殁殇残殒殓殚殡殴毁毂毕毙毡毵氇气氢氩氲汇汉汤汹沟没沣沤沥沦沧沪泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浊测浍济浏浐浑浒浓浔浕涂涌涛涝涞涟涠涡涣涤润涧涨涩淀渊渌渍渎渐渑渔渖渗温湾湿溃溅溆溇滗滚滞滟滠满滢滤滥滦滨滩滪漤潆潇潋潍潜潴澜濑濒灏灭灯灵灾灿炀炉炖炜炝点炼炽烁烂烃烛烟烦烧烨烩烫烬热焕焖焘煴爱爷牍牦牵牺犊状犷犸犹狈狝狞独狭狮狯狰狱狲猃猎猕猡猪猫猬献獭玑玙玚玛玮环现玱玺珉珏珐珑珰珲琏琐琼瑶瑷璎瓒瓯电画畅畴疖疗疟疠疡疬疮疯疱疴痈痉痒痖痨痪痫瘅瘆瘗瘘瘪瘫瘾瘿癞癣癫皑皱皲盏盐监盖盗盘眍眦眬着睁睐睑瞒瞩矫矶矾矿砀码砖砗砚砜砺砻砾础硁硕硖硗硙硚确硷碍碛碜碱礼祎祢祯祷祸禀禄禅离秃秆种积称秽秾稆税稣稳穑穷窃窍窑窜窝窥窦窭竖竞笃笋笔笕笺笼笾筑筚筛筜筝筹签简箓箦箧箨箩箪箫篑篓篮篱簖籁籴类籼粜粝粤粪粮糁糇紧絷纟纠纡红纣纤纥约级纨纩纪纫纬纭纯纰纱纲纳纵纶纷纸纹纺纽纾线绀绁绂练组绅细织终绉绊绌绍绎经绐绑绒结绔绕绖绗绘给绚绛络绝绞统绠绡绢绣绥绦继绩绪绫续绮绯绰绱绲绳维绵绶绷绸综绽绾绿缀缁缂缃缄缅缆缇缈缉缊缋缌缍缎缏缑缒缓缔缕编缗缘缙缚缛缜缝缟缠缡缢缣缤缥缦缧缨缩缪缫缬缭缮缯缰缱缴缵罂网罗罚罢罴羁羟羡翘翙耸耧耻聂聋职聍联聩聪肃肠肤肮肴肾肿胀胁胆胜胧胨胪胫胶脉脍脏脐脑脓脔脚脱脶脸腊腌腘腭腻腼腾膑臜舆舣舰舱舻艰艳艺节芈芗芜芦苁苇苈苋苌苍苎苏苘苹茎茏茑茔茕茧荆荐荙荚荛荜荞荟荠荡荣荤荥荦荧荨荩荪荫荬荭药莅莱莲莳莴莶获莸莹莺莼萚萝萤营萦萧萨葱蒇蒉蒋蒌蓝蓟蓠蓣蓥蓦蔷蔹蔺蔼蕲蕴薮藓蘖虏虑虚虫虬虮虽虾虿蚀蚁蚂蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蜡蝇蝈蝉蝎蝼蝾螀螨蟏衅衔补衬衮袄袅袆袜袭袯装裆裈裢裣裤裥褛褴襁襕见观规觅视觇览觉觊觋觌觎觏觐觑觞触觯詟誉誊讠计订讣认讥讦讧讨让讪讫训议讯记讲讳讴讵讶讷许讹论讼讽设访诀证诂诃评诅识诈诉诊诋诌词诎诏译诒诓诔试诖诗诘诚诛诜话诞诟诠诡询诣诤该详诧诨诩诪诫诬语诮误诰诱诲诳说诵诶请诸诹诺读诼诽课诿谀谁谂调谄谅谆谈谊谋谌谍谎谏谐谑谒谓谔谕谖谗谘谙谚谛谜谝谞谟谠谡谢谣谤谥谦谧谨谩谪谫谬谭谮谯谰谱谲谳谴谵谷豮贝贞负贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赅赆赇赈赉赊赋赌赍赎赏赐赑赒赓赔赖赘赙赚赛赞赠赡赢赣赪赵赶趋趱趸跃跄跞践跶跷跸跹跻踊踌踪踬踯蹑蹒蹰蹿躏躜躯车轧轨轩轪转轭轮软轰轱轲轳轴轵轶轸轹轺轻轼载轾轿辁辂较辄辅辆辇辈辉辊辋辍辎辏辐辑输辔辕辖辗辘辙辽达迁过迈运还这进远违连迟迩迪迹适选逊递逦逻遗遥邓邝邬邮邹邺邻郁郏郐郑郓郦郧郸酝酦酱酽酾酿释里鉴銮錾钅钆钇针钉钊钋钌钍钎钏钐钒钓钔钕钗钙钚钛钜钝钞钟钠钡钢钣钤钥钦钧钨钩钪钫钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铄铅铆铈铉铊铋铌铍铎铐铑铒铕铗铙铚铛铜铝铞铟铠铡铢铣铤铥铧铨铩铪铫铬铭铮铯铰铱铲铳铴铵银铷铸铹铺铻铼铽链铿销锁锂锃锄锅锆锇锋锌锏锐锑锒锓锔锕锖锗错锚锛锜锝锞锟锡锢锣锤锥锦锨锪锫锬锭键锯锰锱锲锴锵锶锷锸锹锺锻锼锾锿镀镁镂镄镅镆镇镉镊镌镍镎镏镐镑镒镓镔镕镖镗镘镙镚镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镱镲镳镴镵镶长门闩闪闫闭问闯闰闲间闵闶闷闸闹闺闻闼闽闾阀阁阂阃阄阅阆阈阉阊阋阌阍阎阏阐阑阒阔阕阖阗阘阙阚队阳阴阵阶际陆陇陈陉陕陧陨险随隐隶隽难雏雠雳雾霁霉静靥鞑鞒鞯韦韧韩韪韫韬韵页顶顷项顺须顼顽顾顿颀颁颂预颅领颇颈颉颊颌颍颎颏颐频颓颔颖颗题颙额颚颛颜颡颢颤颥颦颧风飏飐飒飓飔飕飘飙飚飞飨餍饣饥饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饺饸饹饼饽饿馀馁馂馃馄馅馆馈馊馋馍馏馐馑馒馓馔馕马驭驮驯驰驱驳驴驵驶驷驸驹驻驼驽驾驿骀骁骂骄骅骆骇骈骊骋验骏骐骑骒骓骖骗骘骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋鬓魇鱼鱽鱿鲀鲁鲂鲅鲆鲇鲈鲊鲋鲍鲎鲐鲑鲒鲔鲕鲚鲛鲜鲞鲟鲠鲡鲢鲣鲤鲥鲦鲧鲨鲩鲫鲭鲮鲰鲱鲲鲳鲴鲵鲶鲷鲸鲺鲻鲼鲽鲾鲿鳀鳁鳂鳃鳄鳅鳇鳌鳍鳎鳏鳐鳓鳔鳕鳖鳗鳘鳙鳜鳝鳞鳟鳢鸟鸠鸡鸢鸣鸥鸦鸨鸩鸪鸫鸬鸭鸯鸱鸲鸳鸵鸶鸷鸸鸹鸺鸻鸼鸽鸾鸿鹁鹂鹄鹅鹆鹇鹈鹉鹊鹋鹌鹏鹐鹑鹕鹖鹗鹘鹚鹛鹜鹞鹡鹣鹤鹦鹧鹨鹩鹪鹫鹬鹭鹯鹰鹱鹲鹳鹴鹾麦黄黉齐齑齿龀龃龄龅龆龇龈龉龊龋龌龙龚龛龟";
  const traditional =
    "萬與醜專業叢東絲丟兩嚴喪個豐臨為麗舉麼義烏樂喬習鄉書買亂爭於虧雲亞產畝親褻嚲億僅從侖倉儀們價眾優夥會傘偉傳傷倫偽佇體餘傭僉俠侶僥偵側僑儈儕儂俁儔儼倆儷儉債傾傯僂僨償儻儐儲儺兒兌兗黨蘭關興茲養獸囅內岡冊寫軍農塚馮衝決況凍淨淒準涼減湊凜幾鳳鳧憑凱擊鑿芻劃劉則剛創刪別剗剄剎劊劌剴劑剮劍剝劇勸辦務勱動勵勁勞勢勳猛勩勻匭匱區醫華協單賣盧鹵臥衛卻巹廠廳歷厲壓厭厙廁廂厴廈廚廄廝縣參叄雙發變敘疊葉號嘆嘰籲後嚇呂嗎唚噸聽啟吳吶嘸囈嘔嚦唄員咼嗆嗚詠嚨嚀噝吒響啞噠嘵嗶噦嘩噲嚌噥喲嘜嗊嘮啢嗩喚嘖嗇囀齧囉嘽嘯噴嘍嚳囁噯噓嚶囑嚕囂團園囪圍圇國圖圓聖壙場阪壞塊堅壇壢壩塢墳墜壟壟壚壘墾堊墊埡壋塏堖塒塤堝垵塹墮壪牆壯聲殼壺處備復夠頭誇夾奪奩奐奮獎奧妝婦媽嫵嫗媯姍薑婁婭嬈嬌孌娛媧嫻嫿嬰嬋嬸媼嬡嬪嬙嬤孫學孿寧寶實寵審憲宮寬賓寢對尋導壽將爾塵嘗堯尷屍盡層屓屜屆屬屢屨嶼歲豈嶇崗峴嶴嵐島嶺嶽崠巋嶨嶧峽嶢嶠崢巒嶗崍嶮嶄嶸嶔嶁巔鞏巰幣帥師幃帳簾幟帶幀幫幬幘幗冪莊慶廬廡庫應廟龐廢廎廩開異棄張彌弦彎彈強歸當錄彥徹徑徠憶懺憂愾懷態慫憮慪悵愴憐總懟懌戀懇惡慟懨愷惻惱惲悅愨懸慳憫驚懼慘懲憊愜慚憚慣慍憤憒願懾懣懶懍戇戔戲戧戰戩戶紮撲執擴捫掃揚擾撫拋摶摳掄搶護報擔擬攏揀擁攔擰撥擇掛摯攣掗撾撻挾撓擋撟掙擠揮撏撈損撿換搗據撚擄摑擲撣摻摜攬撳攙擱摟攪攜攝攄擺搖擯攤攖撐攆擷擼攛擻攢敵斂數齋斕鬥斬斷無舊時曠暘曇晝顯晉曬曉曄暈暉暫暖暗術機殺雜權條來楊榪傑極構樅樞棗櫪梘棖槍楓梟櫃檸檉梔柵標棧櫛櫳棟櫨櫟欄樹棲樣欒棬椏橈楨檔榿橋樺檜槳樁夢檮棶槤檢梲欞槨櫝槧欏橢樓欖榲櫬櫚櫸檟檻檳櫧橫檣櫻櫫櫥櫓櫞檁歡歟歐慾殲歿殤殘殞殮殫殯毆毀轂畢斃氈毿氌氣氫氬氳匯漢湯洶溝沒灃漚瀝淪滄滬濘淚澩瀧瀘濼瀉潑澤涇潔灑窪浹淺漿澆湞濁測澮濟瀏滻渾滸濃潯濜塗湧濤澇淶漣潿渦渙滌潤澗漲澀澱淵淥漬瀆漸澠漁瀋滲溫灣濕潰濺漵漊潷滾滯灩灄滿瀅濾濫灤濱灘澦灠瀠瀟瀲濰潛瀦瀾瀨瀕灝滅燈靈災燦煬爐燉煒熗點煉熾爍爛烴燭煙煩燒燁燴燙燼熱煥燜燾熅愛爺牘氂牽犧犢狀獷獁猶狽獮獰獨狹獅獪猙獄猻獫獵獼玀豬貓蝟獻獺璣璵瑒瑪瑋環現瑲璽瑉玨琺瓏璫琿璉瑣瓊瑤璦瓔瓚甌電畫暢疇癤療瘧癘瘍鬁瘡瘋皰痾癰痙癢瘂癆瘓癇癉瘮瘞瘺癟癱癮癭癩癬癲皚皺皸盞鹽監蓋盜盤瞘眥矓著睜睞瞼瞞矚矯磯礬礦碭碼磚硨硯碸礪礱礫礎硜碩硤磽磑礄確鹼礙磧磣鹼禮禕禰禎禱禍稟祿禪離禿稈種積稱穢穠穭稅穌穩穡窮竊竅窯竄窩窺竇窶豎競篤筍筆筧箋籠籩築篳篩簹箏籌簽簡籙簀篋籜籮簞簫簣簍籃籬籪籟糴類秈糶糲粵糞糧糝餱緊縶糹糾紆紅紂纖紇約級紈纊紀紉緯紜純紕紗綱納縱綸紛紙紋紡紐紓線紺紲紱練組紳細織終縐絆絀紹繹經紿綁絨結絝繞絰絎繪給絢絳絡絕絞統綆綃絹繡綏絛繼績緒綾續綺緋綽緔緄繩維綿綬繃綢綜綻綰綠綴緇緙緗緘緬纜緹緲緝縕繢緦綞緞緶緱縋緩締縷編緡緣縉縛縟縝縫縞纏縭縊縑繽縹縵縲纓縮繆繅纈繚繕繒韁繾繳纘罌網羅罰罷羆羈羥羨翹翽聳耬恥聶聾職聹聯聵聰肅腸膚骯餚腎腫脹脅膽勝朧腖臚脛膠脈膾臟臍腦膿臠腳脫腡臉臘醃膕齶膩靦騰臏臢輿艤艦艙艫艱豔藝節羋薌蕪蘆蓯葦藶莧萇蒼苧蘇檾蘋莖蘢蔦塋煢繭荊薦薘莢蕘蓽蕎薈薺蕩榮葷滎犖熒蕁藎蓀蔭蕒葒藥蒞萊蓮蒔萵薟獲蕕瑩鶯蓴蘀蘿螢營縈蕭薩蔥蕆蕢蔣蔞藍薊蘺蕷鎣驀薔蘞藺藹蘄蘊藪蘚櫱虜慮虛蟲虯蟣雖蝦蠆蝕蟻螞蠶蠔蜆蠱蠣蟶蠻蟄蛺蟯螄蠐蛻蝸蠟蠅蟈蟬蠍螻蠑螿蟎蠨釁銜補襯袞襖裊褘襪襲襏裝襠褌褳襝褲襇褸襤襁襴見觀規覓視覘覽覺覬覡覿覦覯覲覷觴觸觶讋譽謄訁計訂訃認譏訐訌討讓訕訖訓議訊記講諱謳詎訝訥許訛論訟諷設訪訣證詁訶評詛識詐訴診詆謅詞詘詔譯詒誆誄試詿詩詰誠誅詵話誕詬詮詭詢詣諍該詳詫諢詡譸誡誣語誚誤誥誘誨誑說誦誒請諸諏諾讀諑誹課諉諛誰諗調諂諒諄談誼謀諶諜謊諫諧謔謁謂諤諭諼讒諮諳諺諦謎諞諝謨讜謖謝謠謗諡謙謐謹謾謫譾謬譚譖譙讕譜譎讞譴譫穀豶貝貞負貢財責賢敗賬貨質販貪貧貶購貯貫貳賤賁貰貼貴貺貸貿費賀貽賊贄賈賄貲賃賂贓資賅贐賕賑賚賒賦賭齎贖賞賜贔賙賡賠賴贅賻賺賽贊贈贍贏贛赬趙趕趨趲躉躍蹌躒踐躂蹺蹕躚躋踴躊蹤躓躑躡蹣躕躥躪躦軀車軋軌軒軑轉軛輪軟轟軲軻轤軸軹軼軫轢軺輕軾載輊轎輇輅較輒輔輛輦輩輝輥輞輟輜輳輻輯輸轡轅轄輾轆轍遼達遷過邁運還這進遠違連遲邇迪跡適選遜遞邐邏遺遙鄧鄺鄔郵鄒鄴鄰鬱郟鄶鄭鄆酈鄖鄲醞醱醬釅釃釀釋裡鑒鑾鏨釒釓釔針釘釗釙釕釷釺釧釤釩釣鍆釹釵鈣鈈鈦鉅鈍鈔鐘鈉鋇鋼鈑鈐鑰欽鈞鎢鉤鈧鈁鈥鈄鈕鈀鈺錢鉦鉗鈷缽鈳鉕鈽鈸鉞鑽鉬鉭鉀鈿鈾鐵鉑鈴鑠鉛鉚鈰鉉鉈鉍鈮鈹鐸銬銠鉺銪鋏鐃銍鐺銅鋁銱銦鎧鍘銖銑鋌銩鏵銓鎩鉿銚鉻銘錚銫鉸銥鏟銃鐋銨銀銣鑄鐒鋪鋙錸鋱鏈鏗銷鎖鋰鋥鋤鍋鋯鋨鋒鋅鐧銳銻鋃鋟鋦錒錆鍺錯錨錛錡鍀錁錕錫錮鑼錘錐錦鍁鍃錇錟錠鍵鋸錳錙鍥鍇鏘鍶鍔鍤鍬鍾鍛鎪鍰鎄鍍鎂鏤鐨鎇鏌鎮鎘鑷鐫鎳鎿鎦鎬鎊鎰鎵鑌鎔鏢鏜鏝鏍鏰鏡鏑鏃鏇鏐鐔钁鐐鏷鑥鐓鑭鐠鑹鏹鐙鑊鐳鐶鐲鐮鐿鑔鑣鑞鑱鑲長門閂閃閆閉問闖閏閒間閔閌悶閘鬧閨聞闥閩閭閥閣閡閫鬮閱閬閾閹閶鬩閿閽閻閼闡闌闃闊闋闔闐闒闕闞隊陽陰陣階際陸隴陳陘陝隉隕險隨隱隸雋難雛讎靂霧霽黴靜靨韃鞽韉韋韌韓韙韞韜韻頁頂頃項順須頊頑顧頓頎頒頌預顱領頗頸頡頰頜潁熲頦頤頻頹頷穎顆題顒額顎顓顏顙顥顫顬顰顴風颺颭颯颶颸颼飄飆飈飛饗饜飠饑飥餳飩餼飪飫飭飯飲餞飾飽飼飿飴餌饒餉餃餄餎餅餑餓餘餒餕餜餛餡館饋餿饞饃餾饈饉饅饊饌饢馬馭馱馴馳驅駁驢駔駛駟駙駒駐駝駑駕驛駘驍罵驕驊駱駭駢驪騁驗駿騏騎騍騅驂騙騭騷騖驁騮騫騸驃騾驄驏驟驥驦驤髏髖鬢魘魚魛魷魨魯魴鮁鮃鮎鱸鮓鮒鮑鱟鮐鮭鮚鮪鮞鱭鮫鮮鯗鱘鯁鱺鰱鰹鯉鰣鰷鯀鯊鯇鯽鯖鯪鯫鯡鯤鯧鯝鯢鯰鯛鯨鯴鯔鱝鰈鰏鱨鯷鰛鰃鰓鱷鰍鰉鰲鰭鰨鰥鰩鰳鰾鱈鱉鰻鰵鱅鱖鱔鱗鱒鱧鳥鳩雞鳶鳴鷗鴉鴇鴆鴣鶇鸕鴨鴦鴟鴝鴛鴕鷥鷙鴯鴰鵂鴴鵃鴿鸞鴻鵓鸝鵠鵝鵒鷳鵜鵡鵲鶓鵪鵬鵮鶉鶘鶡鶚鶻鶿鶥鶩鷂鶺鶼鶴鸚鷓鷚鷯鷦鷲鷸鷺鸇鷹鸌鸏鸛鸘鹺麥黃黌齊齏齒齔齟齡齙齠齜齦齬齪齲齷龍龔龕龜";

  const s2tMap = new Map<string, string>();
  for (let index = 0; index < simplified.length; index++) {
    s2tMap.set(simplified[index], traditional[index]);
  }
  const skippedTags = new Set([
    "SCRIPT",
    "STYLE",
    "CODE",
    "PRE",
    "KBD",
    "SAMP",
    "TEXTAREA",
    "INPUT",
    "SVG",
  ]);
  const skippedSelectors =
    ".icon,.language-flag,#zh-convert-btn,#nav-language-btn,mjx-container";
  const zhOriginalText = new WeakMap<Text, string>();
  type OpenCCWindow = Window &
    typeof globalThis & {
      OpenCC?: {
        Converter: (options: {
          from: string;
          to: string;
        }) => (text: string) => string;
      };
    };
  let zhOpenccConverter: ((text: string) => string) | undefined;
  const zhPunctuationMap = new Map([
    ["“", "「"],
    ["”", "」"],
    ["‘", "『"],
    ["’", "』"],
  ]);

  function toTraditional(text: string) {
    const opencc = (window as OpenCCWindow).OpenCC;
    if (!zhOpenccConverter && opencc) {
      zhOpenccConverter = opencc.Converter({ from: "cn", to: "twp" });
    }
    const converted = zhOpenccConverter
      ? zhOpenccConverter(text)
      : Array.from(text, (char) => s2tMap.get(char) || char).join("");
    return Array.from(
      converted,
      (char) => zhPunctuationMap.get(char) || char,
    ).join("");
  }

  function zhTextNodes(root: ParentNode) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || skippedTags.has(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest(skippedSelectors)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !/[\u4e00-\u9fff]/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }
    return nodes;
  }

  function applyZhConversion(useTraditional: boolean) {
    zhTextNodes(document.body).forEach((node) => {
      const original = zhOriginalText.get(node) || node.nodeValue || "";
      zhOriginalText.set(node, original);
      node.nodeValue = useTraditional ? toTraditional(original) : original;
    });
    zhConvertButton.textContent = useTraditional ? "简" : "繁";
    zhConvertButton.title = useTraditional ? "转换为简体" : "轉換為繁體";
    zhConvertButton.setAttribute(
      "aria-label",
      useTraditional ? "转换为简体" : "轉換為繁體",
    );
    document.documentElement.classList.toggle("zh-traditional", useTraditional);
  }

  type ZhScriptMode = "simplified" | "traditional";
  const zhScriptStorageKey = "zh_script";

  function normalizeZhMode(mode: string | null): ZhScriptMode | null {
    return mode === "simplified" || mode === "traditional" ? mode : null;
  }

  function fallbackZhModeByBrowserLanguage(): ZhScriptMode {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    if (
      languages.some((language) =>
        /^zh-(cn|sg)(?:\b|-|_)/i.test(language.replace("_", "-")),
      )
    ) {
      return "simplified";
    }
    return "traditional";
  }

  async function fetchCountryCode(url: string, field: string) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) {
        return "";
      }
      const data = await response.json();
      return String(data?.[field] || "").toUpperCase();
    } catch {
      return "";
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function detectZhModeByRegion(): Promise<ZhScriptMode> {
    const countryCode =
      (await fetchCountryCode("https://api.country.is/", "country")) ||
      (await fetchCountryCode("https://ipapi.co/json/", "country_code"));
    if (countryCode) {
      return countryCode === "CN" ? "simplified" : "traditional";
    }
    return fallbackZhModeByBrowserLanguage();
  }

  if (isModernChinese) {
    zhConvertButton.id = "zh-convert-btn";
    zhConvertButton.className = "nav-icon zh-convert-btn";
    zhConvertButton.type = "button";
    _$("#sub-nav").append(zhConvertButton);
    const savedZhMode = normalizeZhMode(localStorage.getItem(zhScriptStorageKey));
    applyZhConversion(savedZhMode === "traditional");
    if (!savedZhMode) {
      detectZhModeByRegion().then((detectedMode) => {
        if (normalizeZhMode(localStorage.getItem(zhScriptStorageKey))) {
          return;
        }
        localStorage.setItem(zhScriptStorageKey, detectedMode);
        applyZhConversion(detectedMode === "traditional");
      });
    }
    zhConvertButton.addEventListener("click", () => {
      const useTraditional =
        localStorage.getItem(zhScriptStorageKey) !== "traditional";
      localStorage.setItem(
        zhScriptStorageKey,
        useTraditional ? "traditional" : "simplified",
      );
      applyZhConversion(useTraditional);
    });
    window.addEventListener("pjax:complete", () => {
      applyZhConversion(
        localStorage.getItem(zhScriptStorageKey) === "traditional",
      );
    });
  }

  // Korean Hangul / Hanja-Hangul mixed toggle
  const koScriptButton = document.createElement("button");

  function koPathFallback(targetMode: "mixed" | "hangul") {
    const { pathname, search, hash } = window.location;
    if (targetMode === "mixed" && pathname.startsWith("/ko/")) {
      return `/oko/${pathname.slice(4)}${search}${hash}`;
    }
    if (targetMode === "hangul" && pathname.startsWith("/oko/")) {
      return `/ko/${pathname.slice(5)}${search}${hash}`;
    }
    if (targetMode === "mixed" && pathname === "/ko") {
      return `/oko${search}${hash}`;
    }
    if (targetMode === "hangul" && pathname === "/oko") {
      return `/ko${search}${hash}`;
    }
    return "";
  }

  function koScriptLinks() {
    return (
      (window as any).koScriptLinks || {
        current: "",
        mixed: "",
        hangul: "",
      }
    );
  }

  function currentKoScript() {
    const links = koScriptLinks();
    const current = String(links.current || "").toLowerCase();
    if (current === "ko" || current === "oko") {
      return current;
    }
    const path = window.location.pathname;
    if (path === "/ko" || path.startsWith("/ko/")) {
      return "ko";
    }
    if (path === "/oko" || path.startsWith("/oko/")) {
      return "oko";
    }
    return "";
  }

  function koTargetUrl(targetMode: "mixed" | "hangul") {
    const links = koScriptLinks();
    return links[targetMode] || koPathFallback(targetMode);
  }

  function updateKoScriptButton() {
    const script = currentKoScript();
    const isKorean = script === "ko" || script === "oko";
    koScriptButton.hidden = !isKorean;
    if (!isKorean) {
      koScriptButton.style.setProperty("display", "none", "important");
      return;
    }
    koScriptButton.style.setProperty("display", "flex", "important");

    const useHangul = script !== "ko";
    const targetMode = useHangul ? "hangul" : "mixed";
    const target = koTargetUrl(targetMode);
    koScriptButton.textContent = useHangul ? "한글" : "한자";
    koScriptButton.title = useHangul ? "한글 전용으로 보기" : "國漢文混寫로 보기";
    koScriptButton.setAttribute("aria-label", koScriptButton.title);
    koScriptButton.dataset.targetMode = targetMode;
    koScriptButton.disabled = !target;
  }

  koScriptButton.id = "ko-script-btn";
  koScriptButton.className = "nav-icon ko-script-btn";
  koScriptButton.type = "button";
  _$("#sub-nav").append(koScriptButton);
  updateKoScriptButton();
  koScriptButton.addEventListener("click", () => {
    const targetMode = koScriptButton.dataset.targetMode as "mixed" | "hangul";
    const target = koTargetUrl(targetMode);
    if (!target) {
      return;
    }
    (window as any).isLangSwitch = true;
    document.dispatchEvent(new Event("pjax:send"));
    setTimeout(() => {
      window.location.href = target;
    }, 350);
  });
  window.addEventListener("pjax:complete", updateKoScriptButton);

  // dark_mode
  const themeButton = document.createElement("a");
  themeButton.className = "nav-icon dark-mode-btn";
  _$("#sub-nav").append(themeButton);

  const osMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  function setTheme(config: string) {
    const isAuto = config === "auto";
    const isDark = config === "true" || (isAuto && osMode);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : null);
    localStorage.setItem("dark_mode", config);

    themeButton.id = `nav-${
      config === "true"
        ? "moon"
        : config === "false"
          ? "sun"
          : "circle-half-stroke"
    }-btn`;

    document.body.dispatchEvent(
      new CustomEvent("reimu:theme-set", {
        detail: { isDark, mode: config },
      })
    );
  }
  const savedMode =
    localStorage.getItem("dark_mode") ||
    document.documentElement.getAttribute("data-theme-mode") ||
    "auto";
  setTheme(savedMode);

  themeButton.addEventListener(
    "click",
    throttle(() => {
      const modes = ["auto", "false", "true"];
      const nextMode =
        modes[(modes.indexOf(localStorage.getItem("dark_mode")) + 1) % 3];
      setTheme(nextMode);
    }, 1000),
  );

  let oldScrollTop = 0;
  document.addEventListener("scroll", () => {
    let scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const diffY = scrollTop - oldScrollTop;
    window.diffY = diffY;
    oldScrollTop = scrollTop;
    if (diffY < 0) {
      _$("#header-nav")?.classList.remove("header-nav-hidden");
    } else {
      _$("#header-nav")?.classList.add("header-nav-hidden");
    }
  });

  if (window.Pace) {
    Pace.on("done", () => {
      Pace.sources[0].elements = [];
    });
  }

  // generateScheme
  if (window.materialTheme) {
    const extractor = new materialTheme.ColorThemeExtractor({
      needTransition: false,
    });
    function appendStylesheet() {
      const existingStyle = _$("#reimu-generated-theme-style");
      if (existingStyle) {
        return;
      }
      const css = `
    :root {
      --red-0: var(--md-sys-color-primary-light);
      --red-1: color-mix(in srgb, var(--md-sys-color-primary-light) 90%, white);
      --red-2: color-mix(in srgb, var(--md-sys-color-primary-light) 75%, white);
      --red-3: color-mix(in srgb, var(--md-sys-color-primary-light) 55%, white);
      --red-4: color-mix(in srgb, var(--md-sys-color-primary-light) 40%, white);
      --red-5: color-mix(in srgb, var(--md-sys-color-primary-light) 15%, white);
      --red-5-5: color-mix(in srgb, var(--md-sys-color-primary-light) 10%, white);
      --red-6: color-mix(in srgb, var(--md-sys-color-primary-light) 5%, white);
    
      --color-border: var(--red-3);
      --color-link: var(--red-1);
      --color-meta-shadow: var(--red-6);
      --color-h2-after: var(--red-1);
      --color-red-6-shadow: var(--red-2);
      --color-red-3-shadow: var(--red-3);
    }
    
    [data-theme="dark"]:root {
      --red-0: var(--red-1);
      --red-1: color-mix(in srgb, var(--md-sys-color-primary-dark) 90%, white);
      --red-2: color-mix(in srgb, var(--md-sys-color-primary-dark) 80%, white);
      --red-3: color-mix(in srgb, var(--md-sys-color-primary-dark) 75%, white);
      --red-4: color-mix(in srgb, var(--md-sys-color-primary-dark) 30%, transparent);
      --red-5: color-mix(in srgb, var(--md-sys-color-primary-dark) 20%, transparent);
      --red-5-5: color-mix(in srgb, var(--md-sys-color-primary-dark) 10%, transparent);
      --red-6: color-mix(in srgb, var(--md-sys-color-primary-dark) 5%, transparent);
      
      --color-border: var(--red-5);
    }
    `;

      const style = document.createElement("style");
      style.id = "reimu-generated-theme-style";
      style.textContent = css;
      document.body.appendChild(style);
    }
    async function generateScheme(imageFile: HTMLImageElement) {
      const scheme = await extractor.generateThemeSchemeFromImage(imageFile);
      document.documentElement.style.setProperty(
        "--md-sys-color-primary-light",
        extractor.hexFromArgb(scheme.schemes.light.props.primary),
      );
      document.documentElement.style.setProperty(
        "--md-sys-color-primary-dark",
        extractor.hexFromArgb(scheme.schemes.dark.props.primary),
      );
      appendStylesheet();
    }

    window.generateSchemeHandler = () => {
      if (window.bannerElement?.src) {
        if (window.bannerElement.complete) {
          generateScheme(bannerElement);
        } else {
          window.bannerElement.addEventListener(
            "load",
            () => {
              generateScheme(bannerElement);
            },
            { once: true },
          );
        }
      } else if (window.bannerElement?.style.background) {
        const rgba = window.bannerElement.style.background.match(/\d+/g);
        const scheme = extractor.generateThemeScheme({
          r: parseInt(rgba[0]),
          g: parseInt(rgba[1]),
          b: parseInt(rgba[2]),
        });
        document.documentElement.style.setProperty(
          "--md-sys-color-primary-light",
          extractor.hexFromArgb(scheme.schemes.light.props.primary),
        );
        document.documentElement.style.setProperty(
          "--md-sys-color-primary-dark",
          extractor.hexFromArgb(scheme.schemes.dark.props.primary),
        );
        appendStylesheet();
      }
    };
  }
})();

window.safeImport = async (url: string, integrity?: string) => {
  if (!integrity) {
    return import(url);
  }
  const response = await fetch(url);
  const moduleContent = await response.text();

  const actualHash = await crypto.subtle.digest(
    "SHA-384",
    new TextEncoder().encode(moduleContent),
  );
  const hashBase64 =
    "sha384-" + btoa(String.fromCharCode(...new Uint8Array(actualHash)));

  if (hashBase64 !== integrity) {
    throw new Error(`Integrity check failed for ${url}`);
  }

  const blob = new Blob([moduleContent], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  const module = await import(blobUrl);
  URL.revokeObjectURL(blobUrl);

  return module;
};
