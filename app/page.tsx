"use client"

import { useState, useEffect } from "react"
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
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [gameState, setGameState] = useState<"setup" | "events" | "summary" | "choice" | "talents">("setup")
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
    simulateLife()
  }

  // 模拟生命过程
  const simulateLife = () => {
    // 重置
    setCurrentAge(0)
    setLifeEvents([])

    // 记录选择的天赋
    if (selectedTalents.length > 0) {
      setLifeEvents(["【天赋】"])
      selectedTalents.forEach((talent) => {
        setLifeEvents((prev) => [...prev, `  • ${talent.name}: ${talent.description}`])
      })
    }

    // 开始模拟
    const simulationInterval = setInterval(() => {
      if (simulationPaused) return

      setCurrentAge((age) => {
        const newAge = age + 1

        // 根据属性生成随机生活事件
        if (newAge % 5 === 0 || Math.random() < 0.2) {
          generateEvent(newAge)
        }

        // 检查是否有天命之子天赋，增加特殊事件
        const hasDestinyChild = selectedTalents.some((t) => t.id === "destiny_child")
        if (hasDestinyChild && (newAge === 22 || newAge === 42)) {
          presentSpecialChoice(newAge)
          setSimulationPaused(true)
        }
        // 在关键年龄提供选择
        else if (newAge === 12 || newAge === 18 || newAge === 25 || newAge === 35 || newAge === 50 || newAge === 65) {
          presentChoice(newAge)
          setSimulationPaused(true)
        }

        // 计算寿命
        let maxAge = 70 + Math.floor(attributes.health * 3) + Math.floor(Math.random() * 10)

        // 检查是否有长寿天赋
        const hasLongevity = selectedTalents.some((t) => t.id === "longevity")
        if (hasLongevity) {
          maxAge += 20
        }

        if (newAge >= maxAge) {
          clearInterval(simulationInterval)
          endLife(newAge)
        }

        return newAge
      })
    }, 300)

    return () => clearInterval(simulationInterval)
  }

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
    }

    setCurrentChoice({ question, options })
    setGameState("choice")
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
    }

    setCurrentChoice({ question, options })
    setGameState("choice")
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
    setSimulationPaused(false)
  }

  // 生成随机事件
  const generateEvent = (age: number) => {
    const events = [
      // 童年事件 (0-18)
      ...(age < 18
        ? [
            "开始上学，结交了第一批朋友。",
            `在${attributes.intelligence > 7 ? "数学" : "美术"}比赛中获奖。`,
            "有了人生中的第一次暗恋。",
            `${attributes.health > 7 ? "在体育方面表现出色" : "在体育课上有些吃力"}。`,
            `${attributes.luck > 7 ? "捡到了一枚幸运硬币" : "弄丢了最喜欢的玩具"}。`,
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
          ]
        : []),

      // 老年事件 (60+)
      ...(age >= 60
        ? [
            `${attributes.intelligence > 7 ? "写下了自己的回忆录" : "培养了一个新爱好"}。`,
            `${attributes.wealth > 7 ? "享受着舒适的退休生活" : "继续兼职工作"}。`,
            `${attributes.health > 7 ? "保持活跃和健康" : "管理着几种健康状况"}。`,
            "与老朋友重新联系。",
            `${attributes.luck > 7 ? "在80岁生日时收到了一个惊喜派对" : "平静地庆祝了又一年"}。`,
          ]
        : []),
    ]

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

    const relationships = [
      "幸福地结婚并育有子女",
      "经历了几段有意义的感情",
      "专注于事业发展",
      "拥有一个大家庭",
      "拥有一小群终生的朋友",
    ]

    const achievements = [
      ...(attributes.intelligence > 7 ? ["出版了一本书", "有了科学发现"] : []),
      ...(attributes.appearance > 7 ? ["成为了当地名人", "用你的魅力激励了许多人"] : []),
      ...(attributes.wealth > 7 ? ["建立了成功的商业帝国", "慷慨地捐赠给慈善机构"] : []),
      ...(attributes.health > 7 ? ["保持了良好的健康状态直到晚年", "用你的活力激励了他人"] : []),
      ...(attributes.luck > 7 ? ["拥有了非常幸运的一生", "从几次险境中幸存"] : []),
    ]

    // 检查是否有天命之子天赋，添加特殊成就
    const hasDestinyChild = selectedTalents.some((t) => t.id === "destiny_child")
    if (hasDestinyChild) {
      achievements.push("实现了常人难以企及的人生成就", "你的传奇故事将被后人传颂")
    }

    // 筛选成就为2-4项
    const selectedAchievements = achievements
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.max(2, Math.min(4, achievements.length)))

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
          <CardDescription>分配你的属性和天赋，看看你的人生会如何展开</CardDescription>
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
                <Progress value={(currentAge / 100) * 100} className="h-2 mt-2" />
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

              <div className="border rounded-lg p-4 h-80 overflow-y-auto space-y-2">
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
        </CardContent>

        <CardFooter>
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
            <Button className="w-full" onClick={restart}>
              重新开始
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

