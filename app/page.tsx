"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Dices, Heart, Brain, Coins, Smile, Award, Star } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

// 定义属性类型
type AttributeType = "intelligence" | "appearance" | "wealth" | "health" | "luck"
type Attributes = Record<AttributeType, number>

// 定义天赋效果详情类型
type AttributeBonus = {
  [key in AttributeType]?: {
    cap?: number;
    initial?: number;
  }
}

type EventChanceDetails = {
  wealth_multiplier?: number;
  social_bonus?: boolean;
  education_bonus?: boolean;
}

type LifespanDetails = {
  bonus: number;
}

type SpecialDetails = {
  crisis_bonus?: boolean;
  special_events?: boolean;
}

type TalentEffectDetails = AttributeBonus | EventChanceDetails | LifespanDetails | SpecialDetails;

// 天赋类型定义
type Talent = {
  id: string
  name: string
  description: string
  effect: {
    type: "attribute_bonus" | "event_chance" | "lifespan" | "special"
    details: TalentEffectDetails
  }
  rarity: "普通" | "稀有" | "史诗" | "传说"
  color: string
}

// 选项类型
type ChoiceOption = {
  text: string
  effect: { attribute: AttributeType; value: number }[]
}

export default function LifeRestartSimulator() {
  // 添加客户端渲染控制
  const [isClient, setIsClient] = useState(false)
  
  // 客户端渲染检查
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [gameState, setGameState] = useState<"setup" | "events" | "summary" | "choice" | "talents" | "lifecycle_review">("setup")
  const [currentAge, setCurrentAge] = useState(0)
  const [lifeEvents, setLifeEvents] = useState<string[]>([])
  const [attributes, setAttributes] = useState<Attributes>({
    intelligence: 5, // 智力
    appearance: 5, // 外貌
    wealth: 5, // 财富
    health: 5, // 健康
    luck: 5, // 幸运
  })
  const [attributeCaps] = useState<Attributes>({
    intelligence: 100, // 智力上限
    appearance: 100, // 外貌上限
    wealth: 100, // 财富上限
    health: 100, // 健康上限
    luck: 100, // 幸运上限
  })
  const [pointsRemaining, setPointsRemaining] = useState(30) // 属性分配点数
  const [summary, setSummary] = useState({
    career: "",
    relationships: "",
    achievements: [] as string[],
    finalAge: 0,
  })
  const [simulationPaused, setSimulationPaused] = useState(false)
  const [currentChoice, setCurrentChoice] = useState<{
    question: string
    options: ChoiceOption[]
  } | null>(null)
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>([])
  const maxTalents = 3 // 最多可选天赋数
  const [activeTab, setActiveTab] = useState("attributes")
  const [shouldStartSimulation, setShouldStartSimulation] = useState(false)
  const [isInitialStart, setIsInitialStart] = useState(false)

  // 天赋列表
  const talents: Talent[] = [
    {
      id: "genius",
      name: "天生聪慧",
      description: "智力上限+3，初始智力+2",
      effect: {
        type: "attribute_bonus",
        details: { intelligence: { cap: 3, initial: 2 } },
      },
      rarity: "稀有",
      color: "bg-blue-500",
    },
    {
      id: "beauty",
      name: "天生丽质",
      description: "外貌上限+3，初始外貌+2",
      effect: {
        type: "attribute_bonus",
        details: { appearance: { cap: 3, initial: 2 } },
      },
      rarity: "稀有",
      color: "bg-pink-500",
    },
    {
      id: "wealthy_family",
      name: "富贵家庭",
      description: "财富上限+3，初始财富+2",
      effect: {
        type: "attribute_bonus",
        details: { wealth: { cap: 3, initial: 2 } },
      },
      rarity: "稀有",
      color: "bg-yellow-500",
    },
    {
      id: "strong_physique",
      name: "强健体魄",
      description: "健康上限+3，初始健康+2",
      effect: {
        type: "attribute_bonus",
        details: { health: { cap: 3, initial: 2 } },
      },
      rarity: "稀有",
      color: "bg-green-500",
    },
    {
      id: "fortune_star",
      name: "福星高照",
      description: "幸运上限+3，初始幸运+2",
      effect: {
        type: "attribute_bonus",
        details: { luck: { cap: 3, initial: 2 } },
      },
      rarity: "稀有",
      color: "bg-purple-500",
    },
    {
      id: "longevity",
      name: "长寿之人",
      description: "预期寿命增加20年",
      effect: {
        type: "lifespan",
        details: { bonus: 20 },
      },
      rarity: "稀有",
      color: "bg-emerald-500",
    },
    {
      id: "phoenix_nirvana",
      name: "凤凰涅槃",
      description: "生命中的低谷会带来更大的反弹",
      effect: {
        type: "special",
        details: { crisis_bonus: true },
      },
      rarity: "史诗",
      color: "bg-orange-500",
    },
    {
      id: "golden_finger",
      name: "黄金手指",
      description: "财富相关事件的收益翻倍",
      effect: {
        type: "event_chance",
        details: { wealth_multiplier: 2 },
      },
      rarity: "史诗",
      color: "bg-amber-500",
    },
    {
      id: "social_butterfly",
      name: "社交达人",
      description: "人际关系事件更容易出现积极结果",
      effect: {
        type: "event_chance",
        details: { social_bonus: true },
      },
      rarity: "普通",
      color: "bg-indigo-500",
    },
    {
      id: "quick_learner",
      name: "学习天才",
      description: "教育相关事件更容易成功",
      effect: {
        type: "event_chance",
        details: { education_bonus: true },
      },
      rarity: "普通",
      color: "bg-cyan-500",
    },
    {
      id: "destiny_child",
      name: "天命之子",
      description: "人生中会出现特殊转折点",
      effect: {
        type: "special",
        details: { special_events: true },
      },
      rarity: "传说",
      color: "bg-red-500",
    },
    {
      id: "balanced_development",
      name: "均衡发展",
      description: "所有属性上限+1",
      effect: {
        type: "attribute_bonus",
        details: {
          intelligence: { cap: 1 },
          appearance: { cap: 1 },
          wealth: { cap: 1 },
          health: { cap: 1 },
          luck: { cap: 1 },
        },
      },
      rarity: "普通",
      color: "bg-slate-500",
    },
  ]

  const attributeIcons = {
    intelligence: Brain,
    appearance: Smile,
    wealth: Coins,
    health: Heart,
    luck: Award,
  }

  const attributeNames = {
    intelligence: "智力",
    appearance: "外貌",
    wealth: "财富",
    health: "健康",
    luck: "幸运",
  }

  // 添加事件容器的ref
  const eventsContainerRef = useRef<HTMLDivElement>(null)
  
  // 更新属性值
  const updateAttribute = (attr: AttributeType, value: number[]) => {
    const newValue = value[0]
    const oldValue = attributes[attr]
    const pointDifference = newValue - oldValue

    // 检查是否超过上限
    if (pointsRemaining - pointDifference >= 0 && newValue <= attributeCaps[attr]) {
      setAttributes({ ...attributes, [attr]: newValue })
      setPointsRemaining(pointsRemaining - pointDifference)
    }
  }

  // 选择或取消选择天赋
  const toggleTalent = (talent: Talent) => {
    const isSelected = selectedTalents.some((t) => t.id === talent.id)

    if (isSelected) {
      // 取消选择天赋，移除效果
      setSelectedTalents(selectedTalents.filter((t) => t.id !== talent.id))
      removeTalentEffects(talent)
    } else if (selectedTalents.length < maxTalents) {
      // 选择天赋，应用效果
      setSelectedTalents([...selectedTalents, talent])
      applyTalentEffects(talent)
    }
  }

  // 应用天赋效果
  const applyTalentEffects = (talent: Talent) => {
    if (talent.effect.type === "attribute_bonus") {
      const details = talent.effect.details as AttributeBonus

      // 更新初始属性值
      const newAttributes = { ...attributes }
      let attributePointsUsed = 0

      Object.entries(details).forEach(([attr, bonusObj]) => {
        const attribute = attr as AttributeType
        
        if (bonusObj.initial) {
          newAttributes[attribute] += bonusObj.initial
          attributePointsUsed += bonusObj.initial
        }
      })

      setAttributes(newAttributes)
      setPointsRemaining(pointsRemaining - attributePointsUsed)
    }
  }

  // 移除天赋效果
  const removeTalentEffects = (talent: Talent) => {
    if (talent.effect.type === "attribute_bonus") {
      const details = talent.effect.details as AttributeBonus

      // 恢复初始属性值
      const newAttributes = { ...attributes }
      let attributePointsRestored = 0

      Object.entries(details).forEach(([attr, bonusObj]) => {
        const attribute = attr as AttributeType
        
        if (bonusObj.initial) {
          newAttributes[attribute] -= bonusObj.initial
          attributePointsRestored += bonusObj.initial
        }
      })

      setAttributes(newAttributes)
      setPointsRemaining(pointsRemaining + attributePointsRestored)
    }
  }

  // 开始生命模拟
  const generateLifeEvents = () => {
    setGameState("events")
    // 标记为初始启动
    setIsInitialStart(true)
    setShouldStartSimulation(true)
  }
  
  // 使用useEffect管理生命模拟
  useEffect(() => {
    // 如果不应该开始模拟或者模拟被暂停，则直接返回
    if (!shouldStartSimulation || simulationPaused) return
    
    // 初始化
    if (isInitialStart) {
      setCurrentAge(0)
      setLifeEvents([])

      // 记录选择的天赋
      if (selectedTalents.length > 0) {
        setLifeEvents(["【天赋】"])
        selectedTalents.forEach((talent) => {
          setLifeEvents((prev) => [...prev, `  • ${talent.name}: ${talent.description}`])
        })
      }
      
      // 重置初始启动标记
      setIsInitialStart(false)
    }
    
    // 创建一个变量来存储计时器ID
    let timerID: NodeJS.Timeout | null = null;
    
    // 创建计时器
    timerID = setInterval(() => {
      setCurrentAge((age) => {
        // 记录当前处理的年龄值供后续逻辑使用
        const newAge = age + 1
        
        console.log(`模拟年龄增长：${newAge}岁`); // 调试日志

        // 根据属性生成随机生活事件
        if (newAge % 5 === 0 || Math.random() < 0.2) {
          generateEvent(newAge)
        }

        // 检查是否有天命之子天赋，增加特殊事件
        const hasDestinyChild = selectedTalents.some((t) => t.id === "destiny_child")
        if (hasDestinyChild && (newAge === 22 || newAge === 42 || newAge === 70 || newAge === 100)) {
          presentSpecialChoice(newAge)
          setSimulationPaused(true)
          setShouldStartSimulation(false)
          
          // 清除当前计时器
          if (timerID) {
            clearInterval(timerID)
            timerID = null
          }
          
          return newAge
        }
        // 在关键年龄提供选择
        else if (newAge === 12 || newAge === 18 || newAge === 25 || newAge === 35 || newAge === 50 || 
                 newAge === 65 || newAge === 80 || newAge === 95 || 
                 (newAge >= 110 && newAge % 15 === 0)) { // 110岁后每15年一次选择
          presentChoice(newAge)
          setSimulationPaused(true)
          setShouldStartSimulation(false)
          
          // 清除当前计时器
          if (timerID) {
            clearInterval(timerID)
            timerID = null
          }
          
          return newAge
        }

        // 计算寿命
        let maxAge = 70 + Math.floor(attributes.health * 3) + Math.floor(Math.random() * 10)

        // 检查是否有长寿天赋
        const hasLongevity = selectedTalents.some((t) => t.id === "longevity")
        if (hasLongevity) {
          maxAge += 20
        }
        
        // 超过100岁的情况下有额外的长寿检查
        if (newAge >= 100) {
          // 健康、幸运和智力都会影响能否活到超高龄
          const superAgeChance = (attributes.health * 0.6 + attributes.luck * 0.3 + attributes.intelligence * 0.1) / 100;
          if (Math.random() > superAgeChance) {
            maxAge = Math.min(maxAge, newAge + 5 + Math.floor(Math.random() * 10)); // 随机增加5-15年寿命
          } else {
            maxAge = Math.max(maxAge, 150); // 最低保证150岁寿命上限
          }
        }
        
        // 寿命上限为200岁
        maxAge = Math.min(maxAge, 200);

        if (newAge >= maxAge) {
          // 生命结束
          setShouldStartSimulation(false)
          
          // 清除当前计时器
          if (timerID) {
            clearInterval(timerID)
            timerID = null
          }
          
          endLife(newAge)
          return newAge
        }

        return newAge
      })
    }, 300)

    // 清理函数
    return () => {
      if (timerID) {
        clearInterval(timerID)
        timerID = null
        console.log("清理计时器"); // 调试日志
      }
    }
  }, [shouldStartSimulation, simulationPaused, isInitialStart, selectedTalents, attributes])

  // 添加自动滚动到底部的effect
  useEffect(() => {
    if (gameState === "events" && eventsContainerRef.current) {
      const container = eventsContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [lifeEvents, gameState])

  // 提供特殊选择（天命之子天赋）
  const presentSpecialChoice = (age: number) => {
    let question = ""
    let options: ChoiceOption[] = []

    if (age === 22) {
      question = "命运的十字路口出现了，一个神秘人向你提出了一个选择："
      options = [
        {
          text: "接受一笔巨款，但健康会受到影响",
          effect: [
            { attribute: "wealth", value: 5 },
            { attribute: "health", value: -3 },
          ],
        },
        {
          text: "获得非凡的智慧，但需要牺牲一些社交能力",
          effect: [
            { attribute: "intelligence", value: 5 },
            { attribute: "appearance", value: -2 },
          ],
        },
        {
          text: "拒绝选择，保持生活的平衡",
          effect: [{ attribute: "luck", value: 3 }],
        },
      ]
    } else if (age === 42) {
      question = "一位老者出现在你面前，他似乎能看透你的灵魂："
      options = [
        {
          text: "获得延年益寿的秘方，但需要放弃部分财富",
          effect: [
            { attribute: "health", value: 5 },
            { attribute: "wealth", value: -3 },
          ],
        },
        {
          text: "学习吸引他人的魅力秘诀，但会消耗你的精力",
          effect: [
            { attribute: "appearance", value: 5 },
            { attribute: "health", value: -2 },
          ],
        },
        {
          text: "获得财富增长的秘密，但会减少你的好运",
          effect: [
            { attribute: "wealth", value: 5 },
            { attribute: "luck", value: -3 },
          ],
        },
      ]
    } else if (age === 70) {
      question = "在你的古稀之年，一位神秘的东方人向你伸出了橄榄枝："
      options = [
        {
          text: "学习古老的气功养生术，延年益寿",
          effect: [
            { attribute: "health", value: 5 },
            { attribute: "luck", value: 2 },
          ],
        },
        {
          text: "投资一项前沿的长寿科技研究",
          effect: [
            { attribute: "intelligence", value: 3 },
            { attribute: "wealth", value: -4 },
            { attribute: "health", value: 3 },
          ],
        },
        {
          text: "收养几位年轻人为关门弟子，传授毕生所学",
          effect: [
            { attribute: "appearance", value: 2 },
            { attribute: "intelligence", value: 2 },
          ],
        },
      ]
    } else if (age === 100) {
      question = "百岁人生，弥足珍贵。你收到了一封来自未知人物的邀请："
      options = [
        {
          text: "参与一项神秘的返老还童实验计划",
          effect: [
            { attribute: "health", value: 8 },
            { attribute: "appearance", value: 4 },
            { attribute: "luck", value: -3 },
          ],
        },
        {
          text: "接受全球媒体的专访，分享你的长寿秘诀",
          effect: [
            { attribute: "wealth", value: 5 },
            { attribute: "appearance", value: 3 },
            { attribute: "health", value: -2 },
          ],
        },
        {
          text: "隐居深山，专注于寻找生命的终极意义",
          effect: [
            { attribute: "intelligence", value: 7 },
            { attribute: "luck", value: 3 },
            { attribute: "wealth", value: -3 },
          ],
        },
      ]
    }

    if (options.length > 0) {
      setCurrentChoice({ question, options })
      setGameState("choice")
    } else {
      // 如果没有找到对应年龄的选项，继续模拟
      setSimulationPaused(false)
      setShouldStartSimulation(true)
    }
  }

  // 提供普通选择
  const presentChoice = (age: number) => {
    let question = ""
    let options: ChoiceOption[] = []

    switch (age) {
      case 12:
        question = "12岁的你面临一个选择，课余时间你想要："
        options = [
          {
            text: "专注学习，提高成绩",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "health", value: -1 },
            ],
          },
          {
            text: "参加体育活动，锻炼身体",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: -1 },
            ],
          },
          {
            text: "社交活动，结交更多朋友",
            effect: [
              { attribute: "appearance", value: 1 },
              { attribute: "luck", value: 1 },
            ],
          },
        ]
        break
      case 18:
        question = "高中毕业，你决定："
        options = [
          {
            text: "上大学深造",
            effect: [
              { attribute: "intelligence", value: 3 },
              { attribute: "wealth", value: -2 },
            ],
          },
          {
            text: "直接工作赚钱",
            effect: [
              { attribute: "wealth", value: 2 },
              { attribute: "intelligence", value: -1 },
            ],
          },
          {
            text: "创业尝试",
            effect: [
              { attribute: "luck", value: 2 },
              { attribute: "wealth", value: -1 },
            ],
          },
        ]
        break
      case 25:
        question = "25岁的你在考虑："
        options = [
          {
            text: "专注事业发展",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "health", value: -1 },
            ],
          },
          {
            text: "寻找生活伴侣",
            effect: [
              { attribute: "appearance", value: 2 },
              { attribute: "wealth", value: -1 },
            ],
          },
          {
            text: "环游世界，增长见识",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "wealth", value: -2 },
            ],
          },
        ]
        break
      case 35:
        question = "35岁的你面临中年危机："
        options = [
          {
            text: "转行尝试新领域",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "wealth", value: -2 },
            ],
          },
          {
            text: "稳定发展，专注家庭",
            effect: [
              { attribute: "health", value: 1 },
              { attribute: "wealth", value: 1 },
            ],
          },
          {
            text: "投资理财，为未来做准备",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "luck", value: -1 },
            ],
          },
        ]
        break
      case 50:
        question = "50岁的你开始思考："
        options = [
          {
            text: "保持健康，规律锻炼",
            effect: [
              { attribute: "health", value: 3 },
              { attribute: "appearance", value: 1 },
            ],
          },
          {
            text: "享受生活，培养兴趣爱好",
            effect: [
              { attribute: "luck", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "继续拼搏，追求事业第二春",
            effect: [
              { attribute: "wealth", value: 2 },
              { attribute: "health", value: -2 },
            ],
          },
        ]
        break
      case 65:
        question = "退休后的你决定："
        options = [
          {
            text: "含饴弄孙，享受天伦之乐",
            effect: [
              { attribute: "health", value: 1 },
              { attribute: "luck", value: 1 },
            ],
          },
          {
            text: "环游世界，体验不同文化",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "health", value: -1 },
            ],
          },
          {
            text: "继续工作，做顾问或志愿者",
            effect: [
              { attribute: "wealth", value: 1 },
              { attribute: "intelligence", value: 1 },
            ],
          },
        ]
        break
      case 80:
        question = "80岁的你步入了真正的晚年，你决定："
        options = [
          {
            text: "投入科技辅助，延缓衰老",
            effect: [
              { attribute: "health", value: 3 },
              { attribute: "wealth", value: -3 },
            ],
          },
          {
            text: "组织一个老年志愿者团队，投身公益",
            effect: [
              { attribute: "appearance", value: 2 },
              { attribute: "luck", value: 2 },
            ],
          },
          {
            text: "写一本回忆录，记录精彩人生",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "wealth", value: 1 },
            ],
          },
        ]
        break
      case 95:
        question = "来到95岁高龄，你的目标是："
        options = [
          {
            text: "尝试打破吉尼斯长寿纪录",
            effect: [
              { attribute: "health", value: 4 },
              { attribute: "luck", value: 3 },
              { attribute: "appearance", value: -1 },
            ],
          },
          {
            text: "参与抗衰老科学研究，做实验志愿者",
            effect: [
              { attribute: "intelligence", value: 3 },
              { attribute: "health", value: 2 },
              { attribute: "wealth", value: 1 },
            ],
          },
          {
            text: "创办养老基金会，帮助其他老人",
            effect: [
              { attribute: "wealth", value: -2 },
              { attribute: "appearance", value: 3 },
              { attribute: "luck", value: 2 },
            ],
          },
        ]
        break
      case 110:
      case 120:
      case 125:
      case 135:
      case 140:
      case 150:
      case 155:
      case 165:
      case 170:
      case 180:
      case 185:
      case 195:
        // 确保高龄选项生效
        question = getHighAgeQuestion(age)
        options = getHighAgeOptions(age)
        break
    }

    if (options.length > 0) {
      setCurrentChoice({ question, options })
      setGameState("choice")
    } else {
      // 如果没有找到对应年龄的选项，使用默认选项
      const defaultOptions = getHighAgeOptions(age) // 会返回默认选项
      console.log(`使用默认选项，年龄: ${age}岁`); // 调试日志
      
      setCurrentChoice({ 
        question: getHighAgeQuestion(age),
        options: defaultOptions
      })
      setGameState("choice")
    }
  }

  // 获取高龄问题描述
  const getHighAgeQuestion = (age: number): string => {
    switch(age) {
      case 110:
        return "超过百岁之后，你成为了世人瞩目的焦点："
      case 125:
        return "125岁的你成为了世界奇迹，医学研究者对你产生了浓厚兴趣："
      case 140:
        return "140岁高龄的你已经超越了医学认知的界限："
      case 155:
        return "在155岁这一不可思议的年龄，你接近了人类寿命的极限："
      case 170:
        return "在170岁这一前所未有的年龄，你已经成为人类史上的传奇："
      case 185:
        return "185岁的你已经见证了接近两个世纪的人类历史："
      case 120:
        return "120岁高龄，你已经成为超级百岁老人中的传奇："
      case 135:
        return "135岁的你让长寿专家们困惑不已："
      case 150:
        return "半个世纪又一个世纪，150岁的你站在人类极限的边缘："
      case 165:
        return "165岁的你已成为全球瞩目的研究焦点："
      case 180:
        return "180岁！你几乎已经跨越了两个世纪的人生历程："
      case 195:
        return "站在两个世纪的交界处，195岁的你即将创造历史："
      default:
        return `${age}岁的你站在人生的十字路口：`
    }
  }

  // 获取高龄选项
  const getHighAgeOptions = (age: number): ChoiceOption[] => {
    switch(age) {
      case 110:
        return [
          {
            text: "接受世界顶级长寿研究所的全面身体检查",
            effect: [
              { attribute: "health", value: 5 },
              { attribute: "intelligence", value: 2 },
              { attribute: "appearance", value: -1 },
            ],
          },
          {
            text: "出书分享你的饮食与生活方式",
            effect: [
              { attribute: "wealth", value: 4 },
              { attribute: "appearance", value: 3 },
              { attribute: "health", value: -2 },
            ],
          },
          {
            text: "打破年龄界限，尝试极限运动",
            effect: [
              { attribute: "luck", value: 5 },
              { attribute: "health", value: -3 },
              { attribute: "appearance", value: 4 },
            ],
          },
        ]
      case 125:
        return [
          {
            text: "允许科学家研究你的基因密码",
            effect: [
              { attribute: "intelligence", value: 5 },
              { attribute: "wealth", value: 4 },
              { attribute: "health", value: 2 },
            ],
          },
          {
            text: "尝试突破人类体能极限，创造新纪录",
            effect: [
              { attribute: "health", value: 4 },
              { attribute: "appearance", value: 3 },
              { attribute: "luck", value: 3 },
            ],
          },
          {
            text: "开设长寿课堂，教导年轻人养生之道",
            effect: [
              { attribute: "appearance", value: 4 },
              { attribute: "intelligence", value: 3 },
              { attribute: "wealth", value: 2 },
            ],
          },
        ]
      case 140:
        return [
          {
            text: "参与未来科技公司的实验性生命延长项目",
            effect: [
              { attribute: "health", value: 7 },
              { attribute: "appearance", value: 5 },
              { attribute: "intelligence", value: -2 },
            ],
          },
          {
            text: "隐居与大自然中，追求心灵的永恒",
            effect: [
              { attribute: "intelligence", value: 6 },
              { attribute: "luck", value: 4 },
              { attribute: "wealth", value: -3 },
            ],
          },
          {
            text: "成立私人研究所，探索长生不老的秘密",
            effect: [
              { attribute: "wealth", value: -5 },
              { attribute: "intelligence", value: 8 },
              { attribute: "appearance", value: 3 },
            ],
          },
        ]
      case 155:
        return [
          {
            text: "尝试实验性的意识上传技术",
            effect: [
              { attribute: "intelligence", value: 10 },
              { attribute: "health", value: -3 },
              { attribute: "appearance", value: -4 },
            ],
          },
          {
            text: "组织全球长寿峰会，汇集寿命研究精英",
            effect: [
              { attribute: "wealth", value: 6 },
              { attribute: "appearance", value: 5 },
              { attribute: "health", value: 4 },
            ],
          },
          {
            text: "进行深度冥想修行，追求精神层面的突破",
            effect: [
              { attribute: "luck", value: 8 },
              { attribute: "intelligence", value: 5 },
              { attribute: "health", value: 2 },
            ],
          },
        ]
      case 170:
        return [
          {
            text: "接受先进的机械义体增强",
            effect: [
              { attribute: "health", value: 15 },
              { attribute: "appearance", value: 8 },
              { attribute: "intelligence", value: 5 },
            ],
          },
          {
            text: "将你的全部财富捐赠给延长人类寿命的研究",
            effect: [
              { attribute: "wealth", value: -10 },
              { attribute: "luck", value: 15 },
              { attribute: "appearance", value: 10 },
            ],
          },
          {
            text: "在月球殖民地建立长寿研究中心",
            effect: [
              { attribute: "intelligence", value: 12 },
              { attribute: "wealth", value: -8 },
              { attribute: "health", value: 6 },
            ],
          },
        ]
      case 185:
        return [
          {
            text: "准备突破200岁大关，创造永恒的传奇",
            effect: [
              { attribute: "health", value: 20 },
              { attribute: "luck", value: 15 },
              { attribute: "intelligence", value: 10 },
            ],
          },
          {
            text: "撰写《超越时间：两个世纪的人生智慧》",
            effect: [
              { attribute: "intelligence", value: 18 },
              { attribute: "wealth", value: 12 },
              { attribute: "appearance", value: 8 },
            ],
          },
          {
            text: "成为全球长寿研究的精神领袖",
            effect: [
              { attribute: "appearance", value: 15 },
              { attribute: "intelligence", value: 12 },
              { attribute: "health", value: 10 },
            ],
          },
        ]
      // 添加120岁的选项
      case 120:
        return [
          {
            text: "参与一项前沿的全基因组测序研究",
            effect: [
              { attribute: "intelligence", value: 6 },
              { attribute: "health", value: 3 },
              { attribute: "wealth", value: 2 },
            ],
          },
          {
            text: "创建个人纪录片《超越百年的人生》",
            effect: [
              { attribute: "appearance", value: 5 },
              { attribute: "wealth", value: 4 },
              { attribute: "luck", value: 2 },
            ],
          },
          {
            text: "与顶尖医学专家共同研发长寿秘方",
            effect: [
              { attribute: "health", value: 6 },
              { attribute: "intelligence", value: 4 },
              { attribute: "wealth", value: -3 },
            ],
          },
        ]
      // 添加135岁的选项
      case 135:
        return [
          {
            text: "尝试一种古老的东方修炼方法",
            effect: [
              { attribute: "health", value: 7 },
              { attribute: "luck", value: 5 },
              { attribute: "intelligence", value: 3 },
            ],
          },
          {
            text: "建立超高龄者互助社区",
            effect: [
              { attribute: "appearance", value: 6 },
              { attribute: "wealth", value: -4 },
              { attribute: "health", value: 4 },
            ],
          },
          {
            text: "接受特殊生物疗法延缓衰老",
            effect: [
              { attribute: "health", value: 8 },
              { attribute: "appearance", value: 5 },
              { attribute: "intelligence", value: 2 },
            ],
          },
        ]
      // 添加150岁的选项
      case 150:
        return [
          {
            text: "庆祝自己的150岁生日，邀请全球媒体",
            effect: [
              { attribute: "appearance", value: 9 },
              { attribute: "wealth", value: 5 },
              { attribute: "health", value: -2 },
            ],
          },
          {
            text: "参加一项逆转衰老的尖端科学实验",
            effect: [
              { attribute: "health", value: 10 },
              { attribute: "appearance", value: 6 },
              { attribute: "luck", value: -3 },
            ],
          },
          {
            text: "撰写哲学著作《时间的觉醒》",
            effect: [
              { attribute: "intelligence", value: 10 },
              { attribute: "wealth", value: 4 },
              { attribute: "health", value: -2 },
            ],
          },
        ]
      // 添加165岁的选项
      case 165:
        return [
          {
            text: "与世界各地的百岁老人建立联系网络",
            effect: [
              { attribute: "appearance", value: 10 },
              { attribute: "intelligence", value: 8 },
              { attribute: "health", value: 3 },
            ],
          },
          {
            text: "测试创新的基因疗法",
            effect: [
              { attribute: "health", value: 12 },
              { attribute: "intelligence", value: 6 },
              { attribute: "appearance", value: 5 },
            ],
          },
          {
            text: "与人工智能合作分析你的生命数据",
            effect: [
              { attribute: "intelligence", value: 12 },
              { attribute: "health", value: 8 },
              { attribute: "luck", value: 4 },
            ],
          },
        ]
      // 添加180岁的选项
      case 180:
        return [
          {
            text: "制作虚拟现实体验《穿越两个世纪》",
            effect: [
              { attribute: "intelligence", value: 15 },
              { attribute: "wealth", value: 10 },
              { attribute: "appearance", value: 8 },
            ],
          },
          {
            text: "创立跨世纪长寿基金会",
            effect: [
              { attribute: "wealth", value: -5 },
              { attribute: "appearance", value: 14 },
              { attribute: "luck", value: 10 },
            ],
          },
          {
            text: "与科学家合作完善人类长寿蓝图",
            effect: [
              { attribute: "intelligence", value: 13 },
              { attribute: "health", value: 10 },
              { attribute: "appearance", value: 7 },
            ],
          },
        ]
      // 添加195岁的选项
      case 195:
        return [
          {
            text: "准备迎接你的第二个世纪",
            effect: [
              { attribute: "health", value: 25 },
              { attribute: "luck", value: 20 },
              { attribute: "intelligence", value: 15 },
            ],
          },
          {
            text: "创建《人类寿命革命》国际项目",
            effect: [
              { attribute: "intelligence", value: 20 },
              { attribute: "appearance", value: 15 },
              { attribute: "wealth", value: 10 },
            ],
          },
          {
            text: "成为全球生命科学的精神象征",
            effect: [
              { attribute: "appearance", value: 20 },
              { attribute: "luck", value: 15 },
              { attribute: "intelligence", value: 15 },
            ],
          },
        ]
      default:
        // 为所有其他未定义的选项年龄提供一个通用选项集
        // 这确保任何年龄都不会因为缺少选项而卡住
        return [
          {
            text: "专注于健康养生，延长寿命",
            effect: [
              { attribute: "health", value: Math.ceil(age/20) },
              { attribute: "intelligence", value: Math.ceil(age/30) },
            ],
          },
          {
            text: "分享你的人生经验与智慧",
            effect: [
              { attribute: "appearance", value: Math.ceil(age/25) },
              { attribute: "wealth", value: Math.ceil(age/30) },
            ],
          },
          {
            text: "尝试新的生活方式和挑战",
            effect: [
              { attribute: "luck", value: Math.ceil(age/20) },
              { attribute: "appearance", value: Math.ceil(age/40) },
              { attribute: "health", value: -Math.ceil(age/60) },
            ],
          },
        ]
    }
  }

  // 做出选择
  const makeChoice = (effects: { attribute: AttributeType; value: number }[]) => {
    // 应用选择的效果
    const newAttributes = { ...attributes }

    effects.forEach((effect) => {
      // 检查是否有凤凰涅槃天赋（低谷反弹）
      const hasPhoenixNirvana = selectedTalents.some((t) => t.id === "phoenix_nirvana")
      let valueChange = effect.value

      // 如果是负面效果且有凤凰涅槃天赋
      if (effect.value < 0 && hasPhoenixNirvana) {
        // 50%几率将负面效果减半
        if (Math.random() < 0.5) {
          valueChange = Math.ceil(effect.value / 2)
        }
      }

      // 如果是财富增加且有黄金手指天赋
      if (effect.attribute === "wealth" && effect.value > 0 && selectedTalents.some((t) => t.id === "golden_finger")) {
        valueChange *= 2
      }

      // 应用效果，但不超过上限
      const newValue = Math.min(
        attributeCaps[effect.attribute],
        Math.max(1, newAttributes[effect.attribute] + valueChange),
      )
      newAttributes[effect.attribute] = newValue
    })

    setAttributes(newAttributes)

    // 记录选择
    const choiceEvent = `${currentAge}岁: 你选择了 "${
      currentChoice?.options.find((opt) => JSON.stringify(opt.effect) === JSON.stringify(effects))?.text
    }"`

    setLifeEvents((prev) => [...prev, choiceEvent])

    // 显示属性变化
    effects.forEach((effect) => {
      // 检查是否有特殊天赋修改效果
      let valueChange = effect.value

      if (effect.attribute === "wealth" && effect.value > 0 && selectedTalents.some((t) => t.id === "golden_finger")) {
        valueChange *= 2
      }

      const changeText = `${attributeNames[effect.attribute]} ${valueChange > 0 ? "+" : ""}${valueChange}`
      setLifeEvents((prev) => [...prev, `  → ${changeText}`])
    })

    // 恢复模拟
    setCurrentChoice(null)
    setGameState("events")
    
    // 确保所有状态更新后重新启动模拟
    setTimeout(() => {
      setSimulationPaused(false)
      setShouldStartSimulation(true)
      console.log("选择后重新启动模拟"); // 调试日志
    }, 100) // 增加一点延迟以确保状态更新完成
  }

  // 生成随机事件
  const generateEvent = (age: number) => {
    // 创建属性影响事件类型，包含事件文本和属性效果
    type AttributeEvent = {
      text: string;
      effect?: { attribute: AttributeType; value: number }[];
    };

    // 将基础事件数组转换为包含可能属性效果的事件对象
    const createEvents = (baseEvents: string[]): AttributeEvent[] => {
      return baseEvents.map(text => ({ text }));
    };

    // 定义专门会影响属性的事件
    const attributeEvents: Record<string, AttributeEvent[]> = {
      childhood: [
        { 
          text: "参加了一个有趣的科学夏令营，拓展了眼界。", 
          effect: [{ attribute: "intelligence", value: 1 }] 
        },
        { 
          text: "在学校体育比赛中获得了冠军。", 
          effect: [{ attribute: "health", value: 1 }] 
        },
        { 
          text: "因出色的才艺表演受到了广泛赞誉。", 
          effect: [{ attribute: "appearance", value: 1 }] 
        },
        { 
          text: "救助了一只受伤的小动物，感受到了善良的力量。", 
          effect: [{ attribute: "luck", value: 1 }] 
        },
        { 
          text: "利用零花钱小有成功的理财经验。", 
          effect: [{ attribute: "wealth", value: 1 }] 
        },
        { 
          text: "生了一场大病，身体素质有所下降。", 
          effect: [{ attribute: "health", value: -1 }] 
        },
      ],
      youth: [
        { 
          text: "在大学期间开发了一个广受欢迎的小应用。", 
          effect: [
            { attribute: "intelligence", value: 2 },
            { attribute: "wealth", value: 1 },
          ] 
        },
        { 
          text: "加入了健身房并坚持锻炼，身体素质明显提高。", 
          effect: [{ attribute: "health", value: 2 }] 
        },
        { 
          text: "参加选美比赛获得了不错的名次。", 
          effect: [{ attribute: "appearance", value: 2 }] 
        },
        { 
          text: "在街头偶遇名人并成为朋友。", 
          effect: [{ attribute: "luck", value: 2 }] 
        },
        { 
          text: "投资的一只股票出人意料地大涨。", 
          effect: [{ attribute: "wealth", value: 3 }] 
        },
        { 
          text: "熬夜学习/工作导致健康状况下降。", 
          effect: [
            { attribute: "intelligence", value: 1 },
            { attribute: "health", value: -2 },
          ] 
        },
      ],
      adult: [
        { 
          text: "获得了行业内知名的专业认证。", 
          effect: [{ attribute: "intelligence", value: 2 }] 
        },
        { 
          text: "坚持了多年的健康饮食和锻炼习惯。", 
          effect: [
            { attribute: "health", value: 2 },
            { attribute: "appearance", value: 1 },
          ] 
        },
        { 
          text: "参加高端社交活动结识了重要人脉。", 
          effect: [
            { attribute: "appearance", value: 1 },
            { attribute: "wealth", value: 1 },
          ] 
        },
        { 
          text: "意外获得了一笔遗产。", 
          effect: [
            { attribute: "luck", value: 2 },
            { attribute: "wealth", value: 3 },
          ] 
        },
        { 
          text: "创业项目获得了风险投资。", 
          effect: [
            { attribute: "wealth", value: 4 },
            { attribute: "intelligence", value: 1 },
          ] 
        },
        { 
          text: "经历了严重的职业倦怠。", 
          effect: [
            { attribute: "health", value: -2 },
            { attribute: "intelligence", value: -1 },
          ] 
        },
      ],
      elderly: [
        { 
          text: "出版了一部回忆录，广受赞誉。", 
          effect: [
            { attribute: "intelligence", value: 2 },
            { attribute: "wealth", value: 1 },
          ] 
        },
        { 
          text: "研发了一套适合老年人的健身方法。", 
          effect: [
            { attribute: "health", value: 3 },
            { attribute: "intelligence", value: 1 },
          ] 
        },
        { 
          text: "成为老年时尚的代表人物。", 
          effect: [{ attribute: "appearance", value: 2 }] 
        },
        { 
          text: "在彩票中赢得小奖。", 
          effect: [
            { attribute: "luck", value: 2 },
            { attribute: "wealth", value: 2 },
          ] 
        },
        { 
          text: "长期投资的房产大幅升值。", 
          effect: [{ attribute: "wealth", value: 4 }] 
        },
        { 
          text: "关节炎问题日益严重，行动不便。", 
          effect: [{ attribute: "health", value: -2 }] 
        },
      ],
      superAge: [
        { 
          text: "你的长寿秘诀被国际医学期刊收录研究。", 
          effect: [
            { attribute: "intelligence", value: 3 },
            { attribute: "health", value: 2 },
          ] 
        },
        { 
          text: "百岁后你开始每天游泳锻炼，创造医学奇迹。", 
          effect: [
            { attribute: "health", value: 4 },
            { attribute: "appearance", value: 2 },
          ] 
        },
        { 
          text: "作为超高龄模特拍摄了一组震撼人心的照片。", 
          effect: [
            { attribute: "appearance", value: 3 },
            { attribute: "wealth", value: 2 },
          ] 
        },
        { 
          text: "意外发现了家族遗留的珍贵古董。", 
          effect: [
            { attribute: "luck", value: 3 },
            { attribute: "wealth", value: 5 },
          ] 
        },
        { 
          text: "你的基因被研究机构高价收购研究样本。", 
          effect: [
            { attribute: "wealth", value: 6 },
            { attribute: "health", value: 2 },
          ] 
        },
        { 
          text: "接受了实验性的细胞再生治疗，效果显著。", 
          effect: [
            { attribute: "health", value: 5 },
            { attribute: "appearance", value: 3 },
          ] 
        },
      ],
    };
    
    // 基础事件列表扩展
    const events = [
      // 童年事件 (0-18)
      ...(age < 18
        ? [
            "开始上学，结交了第一批朋友。",
            `在${attributes.intelligence > 7 ? "数学" : "美术"}比赛中获奖。`,
            "有了人生中的第一次暗恋。",
            `${attributes.health > 7 ? "在体育方面表现出色" : "在体育课上有些吃力"}。`,
            `${attributes.luck > 7 ? "捡到了一枚幸运硬币" : "弄丢了最喜欢的玩具"}。`,
            "第一次独自旅行，增长了见识。",
            "学会了骑自行车，感到非常自由。",
            "和家人一起度过了难忘的假期。",
            "得到了期待已久的生日礼物。",
            "参加了学校的艺术节表演。",
            "与邻居家的孩子成为了好朋友。",
            "第一次尝试烹饪，结果出乎意料地好。",
            "帮助家人照顾了一个新生的弟弟或妹妹。",
            "获得了人生中第一个重要奖项。",
            "经历了一次令人难忘的野营活动。",
          ]
        : []),

      // 青年事件 (18-30)
      ...(age >= 18 && age < 30
        ? [
            `${attributes.intelligence > 7 ? "被一所名校录取" : "高中毕业后开始工作"}。`,
            `${attributes.appearance > 7 ? "在社交圈中很受欢迎" : "发展了一小群亲密的朋友"}。`,
            `${attributes.wealth > 7 ? "开始了一个成功的副业" : "为学生贷款而苦恼"}。`,
            "搬到了一个新城市。",
            `${attributes.luck > 7 ? "赢得了一次小型彩票" : "遭遇了一次小车祸"}。`,
            "第一次出国旅行，开阔了视野。",
            "参加了一次有意义的志愿者活动。",
            "开始学习一门新语言。",
            "搬进了自己的第一间公寓。",
            "养了一只宠物，增添了生活乐趣。",
            "开始追求自己真正感兴趣的事业。",
            "遇到了一位重要的人生导师。",
            "尝试了极限运动，克服了恐惧。",
            "第一次投资理财，开始关注个人财务。",
            "与大学好友一起创办了一个小型项目。",
          ]
        : []),

      // 成年事件 (30-60)
      ...(age >= 30 && age < 60
        ? [
            `${attributes.intelligence > 7 ? "晋升为管理职位" : "换了一份新工作"}。`,
            `${attributes.appearance > 7 ? "遇到了生命中的挚爱" : "经历了一系列尴尬的约会"}。`,
            `${attributes.wealth > 7 ? "买了梦想中的房子" : "搬到了更小的公寓以节省开支"}。`,
            `${attributes.health > 7 ? "完成了一次马拉松" : "出现了轻微的健康问题"}。`,
            `${attributes.luck > 7 ? "险些避免了一场灾难" : "丢失了一份重要文件"}。`,
            "开始定期进行体检和健康管理。",
            "学会了平衡工作和个人生活。",
            "培养了一个新的爱好，丰富了生活。",
            "经历了一次重要的职业转变。",
            "开始关注环保和可持续生活方式。",
            "参加了一次有意义的公益活动。",
            "重拾年轻时的兴趣爱好。",
            "开始关注退休规划和长期投资。",
            "与多年未见的老朋友重聚。",
            "学习了一项新的技能以适应职场变化。",
          ]
        : []),

      // 老年事件 (60-100)
      ...(age >= 60 && age < 100
        ? [
            `${attributes.intelligence > 7 ? "写下了自己的回忆录" : "培养了一个新爱好"}。`,
            `${attributes.wealth > 7 ? "享受着舒适的退休生活" : "继续兼职工作"}。`,
            `${attributes.health > 7 ? "保持活跃和健康" : "管理着几种健康状况"}。`,
            "与老朋友重新联系。",
            `${age >= 80 && attributes.luck > 7 ? "在生日时收到了一个惊喜派对" : "平静地庆祝了又一年"}。`, // 修复事件触发
            `${age <= 70 && attributes.luck > 7 ? "钓到了一条罕见的大鱼" : "参加了一次老年健康讲座"}。`, // 新增替代事件
            `${attributes.appearance > 7 ? "被称为'最优雅的老人'" : "开始适应老年的生活节奏"}。`,
            `${attributes.health > 8 ? "每天坚持长跑锻炼身体" : "开始需要定期体检"}。`,
            `${attributes.intelligence > 8 ? "用智慧解决了社区的一个难题" : "在老年大学学习新知识"}。`,
            `${attributes.wealth > 8 ? "资助了几位年轻人完成学业" : "精打细算地管理退休金"}。`,
            `${attributes.luck > 8 ? "意外收到了一笔遗产" : "与几位老友重聚"}。`,
            "开始写一本记录家族历史的书。",
            "与孙辈分享人生经验和智慧。",
            "成为社区志愿者，帮助有需要的人。",
            "尝试绘画或其他艺术形式表达自我。",
            "组织了一次家族大聚会，回忆往昔。",
          ]
        : []),
        
      // 超龄事件 (100+)
      ...(age >= 100
        ? [
            `${attributes.health > 10 ? "你的健康状况让年轻医生都感到惊讶" : "开始使用先进医疗设备保持健康"}。`,
            `${attributes.intelligence > 10 ? "接受了大学的特邀讲座" : "开始记录自己一个世纪的人生经历"}。`,
            `${attributes.appearance > 10 ? "成为高龄模特，登上杂志封面" : "拍摄了一组世纪老人的纪念照片"}。`,
            `${attributes.wealth > 10 ? "资助了一项重大的医学研究" : "将毕生积蓄捐给了慈善机构"}。`,
            `${attributes.luck > 10 ? "被选为世界长寿组织的形象大使" : "收到了来自世界各地的生日祝福"}。`,
            `${age > 120 ? "你打破了当地的长寿纪录" : "接受了媒体关于长寿秘诀的专访"}。`,
            `${age > 140 ? "科学家们对你的DNA产生了浓厚兴趣" : "成为长寿研究的重要案例"}。`,
            `${age > 160 ? "你的生日成为全球性的庆祝活动" : "你的人生故事被改编成了电影"}。`,
            `${age > 180 ? "你被认为是人类历史上的奇迹" : "政府为你颁发了特殊贡献奖章"}。`,
            `${attributes.intelligence > 15 ? "你开始撰写关于人类未来的哲学著作" : "你记录下了跨越两个世纪的社会变迁"}。`,
            `${attributes.health > 15 ? "你的生命力依然顽强，每天坚持锻炼" : "你开始尝试一些新的养生方法"}。`,
            `${attributes.appearance > 15 ? "你的形象被用作长寿研究的标志" : "你参与了一个关于衰老的纪录片拍摄"}。`,
            `${attributes.wealth > 15 ? "你创建了世界上最大的长寿研究基金" : "你为后人留下了宝贵的财富和智慧"}。`,
            `${attributes.luck > 15 ? "你偶然发现了一种增强活力的方法" : "你遇到了另一位百岁老人，成为了朋友"}。`,
            "你接受了一次世纪老人的聚会邀请。",
            "你分享的生活智慧被编纂成书出版。",
            "一位著名导演决定拍摄关于你人生的纪录片。",
            "你成为长寿基因研究的焦点。",
            "你创立了一个跨世纪的时间胶囊项目。",
          ]
        : []),
    ];

    // 检查是否有社交达人天赋
    const hasSocialButterfly = selectedTalents.some((t) => t.id === "social_butterfly")
    if (hasSocialButterfly && Math.random() < 0.3) {
      // 添加积极的社交事件
      const socialEvents = [
        "参加了一个社交活动，结识了重要人脉。",
        "你的魅力让你在一次重要场合脱颖而出。",
        "你的社交能力帮助你解决了一个棘手的问题。",
      ]
      const event = `${age}岁: ${socialEvents[Math.floor(Math.random() * socialEvents.length)]}`
      setLifeEvents((prev) => [...prev, event])
      return
    }

    // 检查是否有学习天才天赋
    const hasQuickLearner = selectedTalents.some((t) => t.id === "quick_learner")
    if (hasQuickLearner && age < 30 && Math.random() < 0.3) {
      // 添加积极的学习事件
      const learningEvents = [
        "你以惊人的速度掌握了一项新技能。",
        "你的学习能力让老师刮目相看。",
        "你轻松通过了一个困难的考试。",
      ]
      const event = `${age}岁: ${learningEvents[Math.floor(Math.random() * learningEvents.length)]}`
      setLifeEvents((prev) => [...prev, event])
      return
    }

    // 有20%的概率触发属性事件
    if (Math.random() < 0.20) {
      let attributeEventPool: AttributeEvent[] = [];
      
      if (age < 18) {
        attributeEventPool = attributeEvents.childhood;
      } else if (age >= 18 && age < 30) {
        attributeEventPool = attributeEvents.youth;
      } else if (age >= 30 && age < 60) {
        attributeEventPool = attributeEvents.adult;
      } else if (age >= 60 && age < 100) {
        attributeEventPool = attributeEvents.elderly;
      } else {
        attributeEventPool = attributeEvents.superAge;
      }
      
      const selectedEvent = attributeEventPool[Math.floor(Math.random() * attributeEventPool.length)];
      
      // 记录事件
      const eventText = `${age}岁: ${selectedEvent.text}`;
      setLifeEvents((prev) => [...prev, eventText]);
      
      // 如果事件有属性效果
      if (selectedEvent.effect) {
        // 应用属性变化
        const newAttributes = { ...attributes };
        
        selectedEvent.effect.forEach((effect) => {
          // 特殊天赋检查（黄金手指等）
          let valueChange = effect.value;
          
          if (effect.attribute === "wealth" && effect.value > 0 && 
              selectedTalents.some((t) => t.id === "golden_finger")) {
            valueChange *= 2;
          }
          
          // 凤凰涅槃天赋检查
          if (effect.value < 0 && 
              selectedTalents.some((t) => t.id === "phoenix_nirvana") && 
              Math.random() < 0.5) {
            valueChange = Math.ceil(effect.value / 2);
          }
          
          // 确保属性值在合理范围内
          const newValue = Math.min(
            attributeCaps[effect.attribute],
            Math.max(1, newAttributes[effect.attribute] + valueChange)
          );
          
          newAttributes[effect.attribute] = newValue;
          
          // 显示属性变化
          const changeText = `  → ${attributeNames[effect.attribute]} ${valueChange > 0 ? "+" : ""}${valueChange}`;
          setLifeEvents((prev) => [...prev, changeText]);
        });
        
        // 更新属性
        setAttributes(newAttributes);
        return;
      }
    }

    // 如果没有触发属性事件，则触发普通事件
    const event = `${age}岁: ${events[Math.floor(Math.random() * events.length)]}`
    setLifeEvents((prev) => [...prev, event])
  }

  // 结束生命模拟
  const endLife = (finalAge: number) => {
    // 根据属性和随机因素生成人生总结
    const careers = [
      "成功的企业家",
      "公司高管",
      "艺术家",
      "教师",
      "医生",
      "工程师",
      "作家",
      "运动员",
      "政治家",
      "科学家",
    ]

    // 为超高龄添加特殊职业
    if (finalAge >= 100) {
      careers.push(
        "长寿研究顾问",
        "人类历史见证者",
        "智慧传承者",
        "世纪老人形象大使",
        "生命科学特殊贡献者"
      )
    }

    const relationships = [
      "幸福地结婚并育有子女",
      "经历了几段有意义的感情",
      "专注于事业发展",
      "拥有一个大家庭",
      "拥有一小群终生的朋友",
    ]

    // 为超高龄添加特殊关系描述
    if (finalAge >= 100) {
      relationships.push(
        "见证了多代子孙的成长",
        "成为了整个社区的精神领袖",
        "与许多杰出人物建立了深厚友谊",
        "指导了数代年轻人的成长",
        "成为了家族的传奇人物"
      )
    }

    const achievements = [
      ...(attributes.intelligence > 7 ? ["出版了一本书", "有了科学发现"] : []),
      ...(attributes.appearance > 7 ? ["成为了当地名人", "用你的魅力激励了许多人"] : []),
      ...(attributes.wealth > 7 ? ["建立了成功的商业帝国", "慷慨地捐赠给慈善机构"] : []),
      ...(attributes.health > 7 ? ["保持了良好的健康状态直到晚年", "用你的活力激励了他人"] : []),
      ...(attributes.luck > 7 ? ["拥有了非常幸运的一生", "从几次险境中幸存"] : []),
    ]

    // 为超高龄添加特殊成就
    if (finalAge >= 100) {
      achievements.push(
        "达到了罕见的百岁高龄",
        "你的长寿秘诀被广泛研究",
        "成为了长寿研究的重要案例"
      )
    }
    
    if (finalAge >= 120) {
      achievements.push(
        "打破了地区长寿纪录",
        "接受了国家级荣誉表彰",
        "你的DNA被科学家视为珍贵样本"
      )
    }
    
    if (finalAge >= 150) {
      achievements.push(
        "被载入人类长寿史册",
        "参与了改变人类寿命认知的研究",
        "你的生平被写入教科书"
      )
    }
    
    if (finalAge >= 180) {
      achievements.push(
        "成为人类历史上的不朽传奇",
        "你的经历跨越了近两个世纪",
        "为人类寿命极限提供了新的可能"
      )
    }

    // 检查是否有天命之子天赋，添加特殊成就
    const hasDestinyChild = selectedTalents.some((t) => t.id === "destiny_child")
    if (hasDestinyChild) {
      achievements.push("实现了常人难以企及的人生成就", "你的传奇故事将被后人传颂")
    }

    // 筛选成就为2-6项，超高龄可以有更多成就
    const maxAchievements = finalAge >= 150 ? 6 : (finalAge >= 100 ? 5 : 4);
    const selectedAchievements = achievements
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.max(2, Math.min(maxAchievements, achievements.length)))

    setSummary({
      career: careers[Math.floor(Math.random() * careers.length)],
      relationships: relationships[Math.floor(Math.random() * relationships.length)],
      achievements: selectedAchievements,
      finalAge,
    })

    setGameState("summary")
  }

  // 重新开始
  const restart = () => {
    setGameState("setup")
    setAttributes({
      intelligence: 5,
      appearance: 5,
      wealth: 5,
      health: 5,
      luck: 5,
    })
    setPointsRemaining(30)
    setLifeEvents([])
    setCurrentAge(0)
    setCurrentChoice(null)
    setSelectedTalents([])
    setActiveTab("attributes")
    setShouldStartSimulation(false)
    setSimulationPaused(false)
  }

  // 如果不是客户端，返回一个简单的加载界面，防止服务器渲染与客户端不匹配
  if (!isClient) {
    return (
      <div className="container max-w-3xl mx-auto py-10 px-4 flex items-center justify-center min-h-[60vh]">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <Dices className="h-8 w-8" />
            人生重开模拟器
          </CardTitle>
          <CardDescription>
            {gameState === "lifecycle_review" 
              ? "回顾你的一生" 
              : "分配你的属性和天赋，看看你的人生会如何展开"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {gameState === "setup" && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="attributes">属性分配</TabsTrigger>
                <TabsTrigger value="talents">天赋选择</TabsTrigger>
              </TabsList>

              <TabsContent value="attributes" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">属性点分配</h3>
                  <p className="text-sm text-muted-foreground">剩余点数: {pointsRemaining}</p>
                </div>

                {Object.entries(attributes).map(([key, value]) => {
                  const attr = key as AttributeType
                  const Icon = attributeIcons[attr]

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <h3 className="font-medium">{attributeNames[attr]}</h3>
                        </div>
                        <span>
                          {value}/{attributeCaps[attr]}
                        </span>
                      </div>
                      <Slider
                        value={[value]}
                        min={1}
                        max={attributeCaps[attr]}
                        step={1}
                        onValueChange={(val) => updateAttribute(attr, val)}
                      />
                    </div>
                  )
                })}
              </TabsContent>

              <TabsContent value="talents" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">选择天赋</h3>
                  <p className="text-sm text-muted-foreground">
                    你可以选择 {maxTalents} 个天赋，已选择 {selectedTalents.length} 个
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {talents.map((talent) => {
                    const isSelected = selectedTalents.some((t) => t.id === talent.id)

                    return (
                      <div
                        key={talent.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-gray-100 dark:bg-gray-800 border-primary" : ""
                        }`}
                        onClick={() => toggleTalent(talent)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${talent.color} text-white`}
                            >
                              <Star className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{talent.name}</span>
                            <Badge variant="outline">{talent.rarity}</Badge>
                          </div>
                          <Checkbox checked={isSelected} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{talent.description}</p>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {gameState === "events" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-medium">年龄: {currentAge}</h3>
                <Progress value={(currentAge / 200) * 100} className="h-2 mt-2" />
              </div>

              {/* 显示当前属性值 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(attributes).map(([key, value]) => {
                  const attr = key as AttributeType
                  const Icon = attributeIcons[attr]
                  
                  return (
                    <div key={key} className="border rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{attributeNames[attr]}</span>
                      </div>
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                })}
              </div>

              <div 
                ref={eventsContainerRef}
                className="border rounded-lg p-4 h-80 overflow-y-auto space-y-2"
              >
                {lifeEvents.map((event, index) => (
                  <p key={index} className="text-sm">
                    {event}
                  </p>
                ))}
              </div>
            </div>
          )}

          {gameState === "summary" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-medium">人生总结</h3>
                <p className="text-muted-foreground">你活到了 {summary.finalAge} 岁</p>
              </div>

              {/* 显示最终属性值 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(attributes).map(([key, value]) => {
                  const attr = key as AttributeType
                  const Icon = attributeIcons[attr]
                  
                  return (
                    <div key={key} className="border rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{attributeNames[attr]}</span>
                      </div>
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">职业</h4>
                  <p>{summary.career}</p>
                </div>

                <div>
                  <h4 className="font-medium">人际关系</h4>
                  <p>{summary.relationships}</p>
                </div>

                <div>
                  <h4 className="font-medium">主要成就</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {summary.achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {gameState === "lifecycle_review" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-medium">生命历程回顾</h3>
                <p className="text-sm text-muted-foreground">你一生的重要事件</p>
              </div>

              <div className="border rounded-lg p-4 h-[60vh] overflow-y-auto space-y-2">
                {lifeEvents.map((event, index) => (
                  <p key={index} className="text-sm">
                    {event}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {gameState === "setup" && (
            <Button className="w-full" onClick={generateLifeEvents} disabled={pointsRemaining > 0}>
              {pointsRemaining > 0 ? `还需分配 ${pointsRemaining} 点` : "开始人生"}
            </Button>
          )}

          {gameState === "events" && (
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">你的人生正在展开...</p>
            </div>
          )}

          {gameState === "summary" && (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <Button className="w-full sm:w-1/2" onClick={() => setGameState("lifecycle_review")}>
                回顾人生历程
              </Button>
              <Button className="w-full sm:w-1/2" onClick={restart}>
                重新开始
              </Button>
            </div>
          )}

          {gameState === "lifecycle_review" && (
            <Button className="w-full" onClick={() => setGameState("summary")}>
              返回人生总结
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog
        open={gameState === "choice"}
        onOpenChange={(open) => {
          if (!open) {
            setGameState("events")
            setSimulationPaused(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>人生选择</DialogTitle>
            <DialogDescription>{currentChoice?.question}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {currentChoice?.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => makeChoice(option.effect)}
              >
                {option.text}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

