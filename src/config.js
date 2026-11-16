/**
 * ============================================================
 *  LITTLE FISH — 全局个性化配置（★ 改这里就够了 ★）
 *  所有需要替换的照片 / 视频 / 语音 / 文案都集中在本文件
 *  素材放到 public/assets/ 对应目录，只改路径即可。
 * ============================================================
 */

export const CONFIG = {
  // ---------- 基础信息 ----------
  siteName: 'LITTLE FISH',
  eventName: '一周年超级福利节',
  herNickname: 'LITTLE FISH 唯一 VIP',   // 她的昵称
  myTitle: '专属配送员：你的男朋友',

  // ---------- 素材路径（缺图时会自动显示占位图，不会崩） ----------
  assets: {
    logo: 'assets/images/icons/logo.png',           // 平台 Logo
    bearAvatar: 'assets/images/icons/bear.png',     // 客服小熊头像
    banner: 'assets/images/backgrounds/banner.jpg', // 首页活动 Banner
    giftWarm: 'assets/images/gifts/warm.jpg',       // 暖手宝照片
    giftLotion: 'assets/images/gifts/lotion.jpg',   // 身体乳照片
    anniversaryVideo: 'assets/videos/anniversary.mp4', // 最终视频（可能删除，删除后流程自动跳过视频）
    bgm: 'assets/audio/bgm.mp3',                    // 背景音乐
    voice: 'assets/audio/voice.mp3',                // 专属语音
    letterPhoto: 'assets/images/letter/handwritten.jpg' // 手写信照片
  },

  // ---------- 拼图照片（第 04 关）｜共 3 张，按 3x3 / 3x3 / 4x4 ----------
  puzzles: [
    { src: 'assets/images/photos/第一次出去住呀.jpg', grid: 3, caption: '第一次出去住呀' },
    { src: 'assets/images/photos/第一次出去旅游呀.jpg', grid: 3, caption: '第一次出去旅游呀' },
    { src: 'assets/images/photos/第一次给你过生日呀.jpg', grid: 4, caption: '第一次给你过生日呀' }
  ],

  // ---------- 寻宝照片 / 时间轴照片（第 05 / 07 关） ----------
  treasurePhoto: 'assets/images/photos/couple1.jpg',   // 花束触发的情侣照片
  // ---------- 时间胶囊（第 07 关）｜回忆重点 ----------
  // fillDate: true  => 她需要手动填写日期（互动）；date: 'xxxx.x.x' => 直接显示
  // text 待用户补充回忆文字；一周年节点暂无照片（还没到）
  timeline: [
    { title: '第一次接你下课', date: '2025.10.11', photos: ['assets/images/photos/tl/34.jpg', 'assets/images/photos/tl/35.mp4'], text: '还是你主动让我来接你的 当时真的特别特别开心 虽然你那时还把我当普通朋友 但是我已经悄悄把你塞进了我的心里 嘿嘿嘿我好变态哦 拥挤的人群我逆向而行 那时候我好像就知道 此刻将成为我日后宝贵的回忆 所以我按下了快门键' },
    { title: '第一次单独约你出去玩', date: '2025.10.12', photos: ['assets/images/photos/tl/31.jpg', 'assets/images/photos/tl/32.jpg', 'assets/images/photos/tl/33.jpg'], text: '梦开始的突破——一切都要从这一天说起。\n前一天晚上我特别激动 我真的很不容易地鼓起勇气邀请你 没想到你答应地那么痛快 那天有了我们的第一张合照 我还偷偷从背后拍了你 说来真的有点巧 那家店是港风回忆风 我从小就特别喜欢老港风 在我喜欢的风格下"约会" 偷偷拍下了我会喜欢一辈子的人' },
    { title: '在一起前一天去公园野餐', fillDate: true, photos: ['assets/images/photos/tl/17.jpg', 'assets/images/photos/tl/18.jpg'], text: '还记得那天我们买了好多水果蛋糕 我吃了好大一个蛋挞哦嘿嘿嘿一下就撑了 你带我跟你闺蜜见面这件事在我心里是一个非常重要的突破 我当时还想着肯定是你已经觉得我通过考核才见你的闺蜜的 哈哈哈哈哈哈哈哈 后面才知道是我自己多想了' },
    { title: '在一起啦',           fillDate: true, photos: ['assets/images/photos/tl/1.jpg',  'assets/images/photos/tl/2.jpg',  'assets/images/photos/tl/37.mp4'], text: '那天你去参加团建 我一个人留在宿舍 我很想你 晚上非常非常惊喜地被你邀请到二号门 其实我在宿舍出发的时候就已经感觉有点不对劲了 你可能会跟我说点啥 但是我完全没想到你会送我花 ! ! ! 直接答应跟我在一起了 我现在回忆写下这些字手都在抖 心跳依然会加快 太激动了 那晚我们从南区走后又去了二运 我们坐在操场 我不知道你是故意冷还是真的有点冷 哈哈哈哈哈哈哈 反正你抱我手了 !嘻嘻嘻 那天之后 我再也不用一个人在宿舍留守了 我也可以跟你一起去团建啦' },
    { title: '第一次一起吃漂亮饭', date: '2025.11.21', photos: ['assets/images/photos/tl/19.jpg', 'assets/images/photos/tl/20.jpg', 'assets/images/photos/tl/36.jpg'], text: '这可是我们第一次一起吃漂亮饭呢 在这之前我们去跟诗雨姐和黄希语在四运晒了太阳撸了猫 见诗雨姐竟然有一种见家长的感觉哈哈哈哈哈哈哈 她还给我俩拍了照呢哈哈哈哈哈 吃这顿饭一个很开心很有意义的开始 我们以后又吃了好多好多这样的饭呢 !' },
    { title: '第一次一起出去住',   date: '2025.11.29', photos: ['assets/images/photos/tl/21.jpg', 'assets/images/photos/tl/22.jpg', 'assets/images/photos/tl/38.jpg', 'assets/images/photos/tl/39.jpg', 'assets/images/photos/tl/40.mp4'], text: '第一次出去住 一个巨大的突破 我第一次能够跟你睡在一张床上 还可以抱你嘿嘿嘿 我真的是第一次体会到这样的幸福感 有你真好 另外 这次出去住是你第一次叫我宝宝哦 就在我们去楼下买东西的时候 大概是在我买完鸡腿之后嘻嘻嘻' },
    { title: '开始为你织花束毛毯', date: '2025.12.11', photos: ['assets/images/photos/tl/23.mp4', 'assets/images/photos/tl/24.jpg', 'assets/images/photos/tl/41.jpg'], text: '在网上看到那些人给女朋友织这个毛毯 我觉得好浪漫 把精力 时间 和爱意融入到这个毛毯中，我就想给你织 说干就干 !刚开始织的时候特别特别困难 学了4个小时才织出来好小好小一点 织了3天之后发现之前织得不好方法不对又重新开始(织得很稀疏 看起来有好多洞) 特别考验我心疼呀 后面我走上正轨了 准备一下熬夜几天把它织完 你说我期末周要复习就不让我织 我就停下了进度 结果一停就停了好久…宝宝 对不起迟到了好久… 你还在你二舅家发现了一毛一样的花束毛毯 我觉得特别好笑啊哎哟' },
    { title: '第一次一起去看电影', date: '2025.12.12', photos: ['assets/images/photos/tl/25.jpg', 'assets/images/photos/tl/26.jpg'], text: '我第一次陪你回家去九龙坡 我们买了冰糖葫芦和烤冷面 那一场我们几乎包场了 就只有几个人 我们一边吃着东西一边看电影 我一边还在给你捏腿 是一个特别幸福的画面呀 疯狂动物城2还是因为我想看才看的嘻嘻嘻' },
    { title: '第一次一起跨年',     fillDate: true, photos: ['assets/images/photos/tl/3.jpg',  'assets/images/photos/tl/4.jpg',  'assets/images/photos/tl/42.mp4'], text: '这是我们第三次出去住 为了跨年 那天特别好玩呀 我还要去考试 你就在酒店等我 你后来跟我说你在厕所上厕所那个 就是那个 那个哈达 不关门看电视 …我们还去了诗雨姐家吃饭 在酒店还给你出了片 我特别开心呀 老婆 我们以后还有好多好多个年会一起跨 !你说是不是呀嘿嘿嘿' },
    { title: '陪你染头发',         date: '2026.1.7',  photos: ['assets/images/photos/tl/27.jpg', 'assets/images/photos/tl/28.jpg', 'assets/images/photos/tl/43.mp4'], text: '回高安前我陪你去染头 我还担心你一个人来染头不安全 染完头发我们在万达广场吃了擂饭 后面我们直接走回了学校 走夜路走回去哦 好爽好幸福 和你一起散步好开心 中途我们还跳广场舞哈哈哈哈哈哈哈 还记得回去的路上特别有过年的氛围呢' },
    { title: '去高安学车',         date: '2026.1.8',  photos: ['assets/images/photos/tl/5.jpg',  'assets/images/photos/tl/6.jpg',  'assets/images/photos/tl/44.jpg', 'assets/images/photos/tl/45.jpg', 'assets/images/photos/tl/46.jpg', 'assets/images/photos/tl/47.mp4'], text: '回高安这段时期我真的将永生难忘 我会永远记住那半个月 我们住在一起吃在一起睡在一起 我们去买菜 我给你做饭 送你上班接你下班 我们在你从小长大的地方散步 看着周围的街道商铺 我想你是怎么在这里l奔跑成长 我看到了更多的你 我们也在这一时期更加亲密了 我们真的很相爱 我好爱你老婆' },
    { title: '你给我过生日',       fillDate: true, photos: ['assets/images/photos/tl/7.jpg',  'assets/images/photos/tl/8.jpg',  'assets/images/photos/tl/48.jpg', 'assets/images/photos/tl/49.jpg'], text: '这一次我真的太感动了 我现在想到那天你把那么多礼物摊开在床上一个个送给我的情景我都想哭 我从小到大真的没咋过过生日 你为我补齐了小时候的遗憾 就好像陪着我成长长大 我真的想哭 第二天我们去欢乐谷也是回忆满满 看着我背着你的照片 我露出了幸福的笑容' },
    { title: '我们新学期的重逢',   date: '2026.2.28', photos: ['assets/images/photos/tl/50.jpg', 'assets/images/photos/tl/51.mp4', 'assets/images/photos/tl/52.mp4'], text: '为什么我要单独把这次列出来呢 那次我们新学期刚开始 我们已经一个寒假没见了 晚上在酒店的床上 你对我说了很多心里话 深情款款 说你想和我有个未来 说你想跟我结婚 我说了我的顾虑 你说没事你养我啊 我眼泪都要掉下来了呜呜呜 这世界上怎么有你这么对我好的人啊老婆' },
    { title: '尾随你和你闺蜜祈福', fillDate: true, photos: ['assets/images/photos/tl/29.jpg', 'assets/images/photos/tl/30.jpg'], text: '那一次我惹你生气了 你不肯见我 也不太想跟我说话 我一不做二不休决定直接堵你 死皮赖脸跟着你 一直尾随你和你闺蜜我远远的一直保持距离连你闺蜜都一直没发现我哈哈哈哈哈哈哈哈 后面你心情好点了愿意和我好好说话了还牵我手 我开心坏了 原来笨笨的执着真的可以打动一个人。 皮莉萍天天开心~' },
    { title: '一起出去旅游',       fillDate: true, photos: ['assets/images/photos/tl/9.jpg',  'assets/images/photos/tl/10.jpg', 'assets/images/photos/tl/53.jpg', 'assets/images/photos/tl/54.jpg'], text: '这是我们第一次一起出去旅行 特别有纪念意义 现在回忆起来每个细节都十分值得怀念 那次我们感情也是出现了裂痕 在去贵阳的火车上我就一直叨叨叨个不停哄你 下高铁后我们打车 在车上我拍你 你对着我比耶 我心里暗暗窃喜 整个旅途我们都十分开心呢 无论是在乌江寨我们冒雨出片 还是晚上在酒店一起看恐怖片 又或者是小七孔的快速一览和坐七八个小时顺风车回重庆 我现在想起都很开心 是一次非常有纪念意义的旅行' },
    { title: '第二次一起卖卡',     date: '2026.7.10', photos: ['assets/images/photos/tl/11.jpg', 'assets/images/photos/tl/12.jpg'], text: '我们俩相识于卖卡 第二次卖卡和第一次感受十分不同 和队伍里其他伙伴的关系不像去年 我们的业绩也不好 那段时间你非常辛苦我也很努力 每天早上去家教 来上班都会给你带一杯奶茶 是我们一起奋斗的日子呀' },
    { title: '我给你过生日',       date: '2026.7.18', photos: ['assets/images/photos/tl/13.jpg', 'assets/images/photos/tl/14.jpg', 'assets/images/photos/tl/55.jpg'], text: '宝宝二十岁啦 对于你这次生日我还是很用心的 白天要卖卡 下班要准备礼物 记得那几天包装礼物写留言写信都熬了好几个大夜 生日当天我们一起做了蛋糕呀 去了一家特别特别高级的餐厅呢 那里让我有一种在欧洲的感觉 配得上宝宝的生日 那天你好漂亮好美老婆 我想 这是我的老婆 她二十岁了 以后她的每一个生日我都会在的' },
    { title: '一起去大足',         date: '2026.8.14', photos: ['assets/images/photos/tl/15.jpg', 'assets/images/photos/tl/16.jpg', 'assets/images/photos/tl/56.jpg', 'assets/images/photos/tl/57.jpg'], text: '宝宝第一次来我的家乡呢 不知道你看着我的高中初中 看着我成长的街道会不会有像我一样的感触呢哈哈哈哈哈哈哈哈(像我在高安时的感触)我们又同居啦 买菜做饭洗衣睡觉看剧嘻嘻嘻 我们去昌州古城和香国公园那晚最让我印象深刻了 好开心好开心好幸福 在秋千上我们荡了好久 像两个长不大的小孩 我们就这样一直在对方面前像个小孩一样天真傻傻地一辈子吧 !' },
    { title: '一周年快乐',         fillDate: true, photos: [], text: '这里还空着一张照片——因为我们的故事，才刚刚写到第一章。' }
  ],

  // ---------- 最终反转文案 ----------
  reversal: {
    lines: [
      '恭喜您，已经成功领取全部福利！',
      '不过……',
      '有一件事情，平台一直没有告诉你。',
      '这里根本不是拼多多。',
      '这是我为你准备的一周年礼物。'
    ],
    afterLines: [
      '这一年的每一份快乐，我都想好好收藏。',
      '谢谢你成为我的女朋友，也谢谢你陪我度过这 365 天。'
    ],
    ctaText: '拆开你的最后一份礼物'
  },

  // ---------- 结局页 ----------
  ending: {
    title: 'HAPPY 1ST ANNIVERSARY',
    lines: [
      '一周年快乐，我的宝贝。',
      '365 天只是一个开始。',
      '希望未来还有很多很多个 365 天。',
      'I LOVE YOU.'
    ]
  },

  // ============================================================
  //  第 07 关：365 DAYS — OUR STORY 时间胶囊（沉浸式滚动纪念册）
  //  开场文案 / 填空互动 / 结尾章节 全部在这里修改。
  //  timeline 数组支持可选字段（不用改也完全正常）：
  //    layout: 'A'|'B'|'C'|'D'|'E'   指定该章节照片布局
  //    importance: 'special'         标记重点回忆（更大更安静的处理）
  //    achievement: '解锁成就：xxx'  该章节留言后显示的成就徽章
  // ============================================================
  capsule: {
    // ---------- PART 01 电影式开场 ----------
    intro: {
      eyebrow: 'FOR MY LITTLE FISH',
      bigTitle: '365',
      bigSub: 'DAYS',
      titleEn: 'OUR STORY',
      titleCn: '我们走过的时间。',
      startDate: '2025.11.16',   // 真实恋爱起始日期（可修改）
      endDate: '2026.11.16',     // 一周年日期（可修改）
      ask: '如果可以重新打开这一年的时间，你愿意和我再走一遍吗？',
      scrollHint: '向下滑动，翻开我们的故事',
      showIntroPhoto: true       // 用第一个时间点的照片做开场照片
    },

    // ---------- 回忆引导卡片（挂在下标 2 的野餐节点） ----------
    // questionTemplate 留空 '' 时：只显示引导语，不出填空题（想恢复就把问题写回来）
    quiz: {
      nodeId: 2,
      lead: [
        '还记得这一天吗？',
        '那时候我们还没有正式在一起，却已经开始拥有只属于我们的回忆。'
      ],
      questionTemplate: '',     // 原「那天我们在公园野餐，____？」已按要求删除；____ 会被替换成输入框
      answers: [],              // ★★ 由你补充真实答案（数组，支持多个可接受说法）★★
                                // 为空时：任意非空答案都会通过（方便先跑通流程）
      hint: '那天的细节，我一直都记得。',
      success: '嘿嘿，看来你还记得。',
      wrong: [
        '记忆芯片好像需要更新一下，再想想嘛。',
        '不对哦～提示离你只有一步之遥。',
        '哈哈没关系，再试一次，我很想让你想起来。'
      ],
      ignorePunctuation: true,  // 校验时忽略标点
      hintAfter: 2,             // 错几次后出现「看看提示」
      revealAfter: 4            // 错几次后出现「看看答案」
    },

    // ---------- 按节点下标配置的成就徽章（可增删） ----------
    achievements: {
      5: '解锁成就：第一次一起出去住。'
    },

    // ---------- PART 07 结尾章节 ----------
    ending: {
      lines: [
        ['原来，不知不觉，我们已经一起走过了这么多日子。'],
        ['有些日子可能很普通。', '但只要和你一起，就变成了我想珍藏很久的回忆。'],
        ['谢谢你出现在我的生活里。', '谢谢你陪我度过这一年的每一天。']
      ],
      finalTitle: '365 DAYS',
      finalSub: 'TO BE CONTINUED...',
      finalNote: '我们的故事，还没有结束。',
      blankNote: ['这里还缺一张照片。', '等我们一起过完第二个周年，再来把它补上吧。'],
      cta: '继续拆开下一份惊喜'
    }
  }
};
