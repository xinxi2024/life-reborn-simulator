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
  isRejuvenation?: boolean
  isImmortalCultivation?: boolean
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
    deathCause: ""
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
  
  // 添加修仙状态管理
  const [isImmortalCultivation, setIsImmortalCultivation] = useState(false)
  const [tribulationsCount, setTribulationsCount] = useState(0)
  const [nextTribulationAge, setNextTribulationAge] = useState(0)
  const [maxAgeLimit, setMaxAgeLimit] = useState(200) // 默认寿命上限

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
      setIsImmortalCultivation(false) // 确保初始化时修仙状态为false
      setTribulationsCount(0)
      setNextTribulationAge(0)
      setMaxAgeLimit(200)

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

        // 检查是否需要渡劫（修仙状态下）
        if (isImmortalCultivation && newAge === nextTribulationAge) {
          // 暂停模拟并触发渡劫
          setSimulationPaused(true)
          setShouldStartSimulation(false)
          
          // 渡劫成功率计算：初始40%，每次渡劫降低2%
          const successRate = Math.max(0, 0.4 - (tribulationsCount * 0.02))
          const isSuccess = Math.random() < successRate
          
          if (isSuccess) {
            // 渡劫成功
            setLifeEvents((prev) => [
              ...prev, 
              `${newAge}岁: 【渡劫】第${tribulationsCount + 1}次渡劫，天空电闪雷鸣...`,
              `  → 你成功渡过天劫，修为更进一步！`,
              `  → 寿命增加50年！`
            ])
            
            // 更新下一次渡劫年龄
            setTribulationsCount((prev) => prev + 1)
            setNextTribulationAge((prev) => prev + 50)
            setMaxAgeLimit((prev) => prev + 50)
            
            // 增加属性
            setAttributes((prev) => ({
              ...prev,
              intelligence: Math.min(100, prev.intelligence + 5),
              health: Math.min(100, prev.health + 5),
              luck: Math.min(100, prev.luck + 3),
            }))
            
            // 恢复模拟
            setTimeout(() => {
              setSimulationPaused(false)
              setShouldStartSimulation(true)
            }, 100)
          } else {
            // 渡劫失败，直接遭受天劫而死
            setLifeEvents((prev) => [
              ...prev, 
              `${newAge}岁: 【渡劫】第${tribulationsCount + 1}次渡劫，天空电闪雷鸣...`,
              `  → 天劫之力过于强大，你未能抵挡...`,
              `  → 你被天雷击中，化为灰烬！`
            ])
            
            // 结束生命
            endLife(newAge, "在修仙渡劫中被天雷击中，化为灰烬")
            return newAge
          }
        }

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
                newAge === 65 || newAge === 80 || newAge === 95 || newAge === 190 ||
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

        // 检查是否达到飞升条件
        if (isImmortalCultivation && newAge >= 1000) {
          // 飞升成仙
          setLifeEvents((prev) => [
            ...prev, 
            `${newAge}岁: 【飞升】经过漫长的修炼，你终于修成正果！`,
            `  → 霞光万道，天音阵阵，你踏上仙路，飞升成仙！`
          ])
          
          // 结束生命
          endLife(newAge, "功德圆满，飞升成仙")
          
          // 清除当前计时器
          if (timerID) {
            clearInterval(timerID)
            timerID = null
          }
          
          return newAge
        }

        // 计算寿命
        let maxAge = isImmortalCultivation ? maxAgeLimit : (70 + Math.floor(attributes.health * 3) + Math.floor(Math.random() * 10))

        // 检查是否有长寿天赋
        const hasLongevity = selectedTalents.some((t) => t.id === "longevity")
        if (hasLongevity && !isImmortalCultivation) {
          maxAge += 20
        }
        
        // 超过100岁的情况下有额外的长寿检查
        if (newAge >= 100 && !isImmortalCultivation) {
          // 健康、幸运和智力都会影响能否活到超高龄
          const superAgeChance = (attributes.health * 0.6 + attributes.luck * 0.3 + attributes.intelligence * 0.1) / 100;
          if (Math.random() > superAgeChance) {
            maxAge = Math.min(maxAge, newAge + 5 + Math.floor(Math.random() * 10)); // 随机增加5-15年寿命
          } else {
            maxAge = Math.max(maxAge, 150); // 最低保证150岁寿命上限
          }
        }
        
        // 寿命上限
        maxAge = Math.min(maxAge, isImmortalCultivation ? 1000 : 200);

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
  }, [shouldStartSimulation, simulationPaused, isInitialStart, selectedTalents, attributes, isImmortalCultivation, tribulationsCount, nextTribulationAge, maxAgeLimit])

  // 添加自动滚动到底部的effect
  useEffect(() => {
    if (gameState === "events" && eventsContainerRef.current) {
      const container = eventsContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [lifeEvents, gameState])

  // 提供特殊选择（天命之子天赋）
  const presentSpecialChoice = (age: number) => {
    // 只在合适的年龄提供特殊选择
    let question = ""
    let options: ChoiceOption[] = []
    
    if (age === 22) {
      question = "年轻的你面临人生的重要岔路"
      options = [
        {
          text: "追求学业上的进一步成就",
          effect: [
            { attribute: "intelligence", value: 3 },
            { attribute: "wealth", value: -1 }
          ]
        },
        {
          text: "专注于职场发展，积累财富",
          effect: [
            { attribute: "wealth", value: 3 },
            { attribute: "intelligence", value: -1 }
          ]
        },
        {
          text: "投资自我，提升外在形象",
          effect: [
            { attribute: "appearance", value: 3 },
            { attribute: "wealth", value: -1 }
          ]
        },
        {
          text: "保持平衡发展，不偏重任何方面",
          effect: [
            { attribute: "intelligence", value: 1 },
            { attribute: "wealth", value: 1 },
            { attribute: "appearance", value: 1 }
          ]
        }
      ]
    } else if (age === 42) {
      question = "中年危机已至，你如何应对？"
      options = [
        {
          text: "职业转型，追求更高成就",
          effect: [
            { attribute: "intelligence", value: 2 },
            { attribute: "wealth", value: 2 },
            { attribute: "health", value: -2 }
          ]
        },
        {
          text: "注重健康，改善生活方式",
          effect: [
            { attribute: "health", value: 4 },
            { attribute: "wealth", value: -1 }
          ]
        },
        {
          text: "追求平衡，家庭与事业兼顾",
          effect: [
            { attribute: "health", value: 1 },
            { attribute: "intelligence", value: 1 },
            { attribute: "wealth", value: 1 }
          ]
        },
        {
          text: "放手一搏，冒险投资",
          effect: [
            { attribute: "wealth", value: 5 },
            { attribute: "health", value: -2 },
            { attribute: "luck", value: -1 }
          ]
        }
      ]
    } else if (age === 70) {
      question = "步入晚年，你如何规划余生？"
      options = [
        {
          text: "退休享福，享受天伦之乐",
          effect: [
            { attribute: "health", value: 2 },
            { attribute: "wealth", value: -1 }
          ]
        },
        {
          text: "继续工作，保持活力",
          effect: [
            { attribute: "intelligence", value: 2 },
            { attribute: "health", value: -1 }
          ]
        },
        {
          text: "投身公益，回馈社会",
          effect: [
            { attribute: "luck", value: 3 },
            { attribute: "wealth", value: -2 }
          ]
        },
        {
          text: "寻找新的兴趣爱好",
          effect: [
            { attribute: "intelligence", value: 1 },
            { attribute: "health", value: 1 },
            { attribute: "appearance", value: 1 }
          ]
        }
      ]
    } else if (age === 100) {
      question = "百岁人生，回首往昔"
      options = [
        {
          text: "写回忆录，传授人生经验",
          effect: [
            { attribute: "intelligence", value: 3 },
            { attribute: "luck", value: 2 }
          ]
        },
        {
          text: "享受每一天，平静度过",
          effect: [
            { attribute: "health", value: 2 },
            { attribute: "luck", value: 2 }
          ]
        },
        {
          text: "仍然关注时事，保持活跃的思维",
          effect: [
            { attribute: "intelligence", value: 4 },
            { attribute: "health", value: -1 }
          ]
        },
        {
          text: "探索未知的可能性",
          effect: [
            { attribute: "luck", value: 5 },
            { attribute: "health", value: -2 }
          ]
        }
      ]
    }

    setCurrentChoice({
      question,
      options
    })
    
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
        question = "18岁的你面临一个选择，即将步入社会："
        options = [
          {
            text: "选择一份稳定的工作，但可能缺乏挑战",
            effect: [
              { attribute: "intelligence", value: 1 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择一份充满挑战的工作，但可能面临经济压力",
            effect: [
              { attribute: "wealth", value: 2 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择创业，但风险较高",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "intelligence", value: 1 },
            ],
          },
        ]
        break

      case 25:
        question = "25岁的你面临一个选择，事业和家庭之间如何平衡："
        options = [
          {
            text: "选择稳定的工作，但可能缺乏激情",
            effect: [
              { attribute: "intelligence", value: 1 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择一份充满激情的工作，但可能面临经济压力",
            effect: [
              { attribute: "wealth", value: 2 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择创业，但风险较高",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "intelligence", value: 1 },
            ],
          },
        ]
        break

      case 35:
        question = "35岁的你面临一个选择，家庭和事业如何兼顾："
        options = [
          {
            text: "选择稳定的工作，但可能缺乏挑战",
            effect: [
              { attribute: "intelligence", value: 1 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择一份充满挑战的工作，但可能面临经济压力",
            effect: [
              { attribute: "wealth", value: 2 },
              { attribute: "health", value: 1 },
            ],
          },
          {
            text: "选择创业，但风险较高",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "intelligence", value: 1 },
            ],
          },
        ]
        break

      case 50:
        question = "50岁的你面临一个选择，如何保持健康和活力："
        options = [
          {
            text: "选择定期体检，保持健康生活方式",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加体育活动，保持身体健康",
            effect: [
              { attribute: "health", value: 3 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加瑜伽或冥想，保持心理健康",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
        ]
        break

      case 65:
        question = "65岁的你面临一个选择，如何度过晚年生活："
        options = [
          {
            text: "选择与家人共度时光，享受天伦之乐",
            effect: [
              { attribute: "health", value: 1 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加社区活动，保持社交活跃",
            effect: [
              { attribute: "appearance", value: 1 },
              { attribute: "luck", value: 1 },
            ],
          },
          {
            text: "选择参加老年大学，继续学习新知识",
            effect: [
              { attribute: "intelligence", value: 2 },
              { attribute: "wealth", value: 1 },
            ],
          },
        ]
        break

      case 80:
        question = "80岁的你面临一个选择，如何保持健康和独立："
        options = [
          {
            text: "选择继续工作，保持社会参与",
            effect: [
              { attribute: "wealth", value: 1 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择在家中养老，享受宁静生活",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加社区活动，保持社交活跃",
            effect: [
              { attribute: "appearance", value: 1 },
              { attribute: "luck", value: 1 },
            ],
          },
        ]
        break

      case 95:
        question = "95岁的你面临一个选择，如何保持健康和尊严："
        options = [
          {
            text: "选择继续工作，保持社会参与",
            effect: [
              { attribute: "wealth", value: 1 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择在家中养老，享受宁静生活",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加社区活动，保持社交活跃",
            effect: [
              { attribute: "appearance", value: 1 },
              { attribute: "luck", value: 1 },
            ],
          },
        ]
        break

      case 190:
        question = "190岁的你面临一个选择，如何保持健康和智慧："
        options = [
          {
            text: "选择继续工作，保持社会参与",
            effect: [
              { attribute: "wealth", value: 1 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择在家中养老，享受宁静生活",
            effect: [
              { attribute: "health", value: 2 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "选择参加社区活动，保持社交活跃",
            effect: [
              { attribute: "appearance", value: 1 },
              { attribute: "luck", value: 1 },
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
      case 190:
      case 195:
        // 确保高龄选项生效
        question = getHighAgeQuestion(age)
        options = getHighAgeOptions(age)
        break

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
      case 120:
        return "120岁高龄，你已经成为超级百岁老人中的传奇："
      case 125:
        return "125岁的你成为了世界奇迹，医学研究者对你产生了浓厚兴趣："
      case 135:
        return "135岁的你让长寿专家们困惑不已："
      case 140:
        return "140岁高龄的你已经超越了医学认知的界限："
      case 150:
        return "半个世纪又一个世纪，150岁的你站在人类极限的边缘："
      case 155:
        return "在155岁这一不可思议的年龄，你接近了人类寿命的极限："
      case 165:
        return "165岁的你已成为全球瞩目的研究焦点："
      case 170:
        return "在170岁这一前所未有的年龄，你已经成为人类史上的传奇："
      case 180:
        return "180岁！你几乎已经跨越了两个世纪的人生历程："
      case 185:
        return "185岁的你已经见证了接近两个世纪的人类历史："
      case 190:
        return "190岁的你站在人类极限的边缘，科学无法解释你的存在，是继续安享晚年，还是追求更高的境界？"
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
      // ... 其他高龄选项 ...
      case 190:
        return [
          {
            text: "安享晚年，静待自然规律",
            effect: [
              { attribute: "health", value: 10 },
              { attribute: "luck", value: 5 },
              { attribute: "intelligence", value: 5 },
            ],
          },
          {
            text: "我命由我不由天！开始修仙之路",
            effect: [
              { attribute: "intelligence", value: 20 },
              { attribute: "health", value: 15 },
            ],
            isImmortalCultivation: true
          },
          {
            text: "总结一生智慧，留给后人",
            effect: [
              { attribute: "intelligence", value: 15 },
              { attribute: "appearance", value: 10 },
              { attribute: "wealth", value: 8 },
            ],
          },
        ]
      default:
        // 为所有其他未定义的选项年龄提供一个通用选项集
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

  // 生成随机事件
  const generateEvent = (age: number) => {
    // 创建属性影响事件类型，包含事件文本和属性效果
    type AttributeEvent = {
      text: string;
      effect?: { attribute: AttributeType; value: number }[];
    };

    // 创建健康危机事件类型，包含事件文本、属性效果和死亡概率
    type HealthCrisisEvent = AttributeEvent & {
      deathChance?: number; // 事件可能导致死亡的概率 (0-1)
    };

    // 将基础事件数组转换为包含可能属性效果的事件对象
    const createEvents = (baseEvents: string[]): AttributeEvent[] => {
      return baseEvents.map(text => ({ text }));
    };

    // 健康危机事件列表 - 随年龄增长风险增加
    const healthCrisisEvents: Record<string, HealthCrisisEvent[]> = {
      // 年轻人危机
      youth: [
        {
          text: "感染了一种罕见的病毒，需要住院治疗。",
          effect: [{ attribute: "health", value: -3 }],
          deathChance: 0.05,
        },
        {
          text: "在一次事故中严重受伤，需要长期康复。",
          effect: [
            { attribute: "health", value: -4 },
            { attribute: "appearance", value: -1 },
          ],
          deathChance: 0.07,
        },
      ],
      // 中年人危机
      adult: [
        {
          text: "被诊断出心脏问题，需要进行手术。",
          effect: [
            { attribute: "health", value: -4 },
            { attribute: "wealth", value: -2 },
          ],
          deathChance: 0.10,
        },
        {
          text: "突发严重疾病，需要长期治疗。",
          effect: [
            { attribute: "health", value: -5 },
            { attribute: "wealth", value: -3 },
          ],
          deathChance: 0.15,
        },
      ],
      // 老年人危机
      elderly: [
        {
          text: "突发脑卒中，住进了重症监护室。",
          effect: [
            { attribute: "health", value: -7 },
            { attribute: "intelligence", value: -2 },
          ],
          deathChance: 0.25,
        },
        {
          text: "连续几个月不明原因的身体虚弱，多方检查未果。",
          effect: [
            { attribute: "health", value: -5 },
            { attribute: "appearance", value: -3 },
          ],
          deathChance: 0.20,
        },
        {
          text: "骨折后并发症严重，康复进展缓慢。",
          effect: [
            { attribute: "health", value: -6 },
            { attribute: "luck", value: -2 },
          ],
          deathChance: 0.20,
        },
      ],
      // 超高龄危机
      superAge: [
        {
          text: "出现多脏器功能衰竭的迹象，医生束手无策。",
          effect: [{ attribute: "health", value: -10 }],
          deathChance: 0.35,
        },
        {
          text: "一场突如其来的疾病让你的健康状况急剧恶化。",
          effect: [
            { attribute: "health", value: -12 },
            { attribute: "appearance", value: -5 },
          ],
          deathChance: 0.40,
        },
        {
          text: "身体各系统开始显著衰退，医疗科技难以逆转。",
          effect: [
            { attribute: "health", value: -8 },
            { attribute: "intelligence", value: -3 },
          ],
          deathChance: 0.30,
        },
      ],
      // 接近极限危机 (160岁以上)
      extremeAge: [
        {
          text: "你的基因遗传限制开始显现，细胞无法继续再生。",
          effect: [{ attribute: "health", value: -15 }],
          deathChance: 0.50,
        },
        {
          text: "人体极限已经临近，每天醒来都是对生命的挑战。",
          effect: [
            { attribute: "health", value: -12 },
            { attribute: "luck", value: -5 },
          ],
          deathChance: 0.55,
        },
        {
          text: "即使最先进的医疗技术也无法阻止衰老的最终进程。",
          effect: [
            { attribute: "health", value: -15 },
            { attribute: "appearance", value: -8 },
          ],
          deathChance: 0.60,
        },
      ],
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
        { 
          text: "因为过度沉迷游戏，视力下降明显。", 
          effect: [{ attribute: "health", value: -2 }] 
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
        { 
          text: "参加极限运动时受伤，需要几个月恢复。", 
          effect: [{ attribute: "health", value: -3 }] 
        },
        { 
          text: "因压力过大出现健康问题，不得不调整生活方式。", 
          effect: [
            { attribute: "health", value: -2 },
            { attribute: "luck", value: -1 },
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
        { 
          text: "工作压力导致高血压，医生建议改变生活方式。", 
          effect: [{ attribute: "health", value: -3 }] 
        },
        { 
          text: "久坐办公生活导致了慢性背痛问题。", 
          effect: [
            { attribute: "health", value: -2 },
            { attribute: "appearance", value: -1 },
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
        { 
          text: "听力明显下降，需要使用助听器。", 
          effect: [
            { attribute: "health", value: -2 },
            { attribute: "intelligence", value: -1 },
          ] 
        },
        { 
          text: "视力问题加重，日常活动受到限制。", 
          effect: [
            { attribute: "health", value: -3 },
            { attribute: "appearance", value: -1 },
          ] 
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
        { 
          text: "即使有高科技医疗辅助，健康状况仍在缓慢下降。", 
          effect: [{ attribute: "health", value: -3 }] 
        },
        { 
          text: "需要更多时间休息，活动能力受限。", 
          effect: [
            { attribute: "health", value: -4 },
            { attribute: "appearance", value: -2 },
          ] 
        },
        { 
          text: "记忆力开始出现明显衰退。", 
          effect: [
            { attribute: "intelligence", value: -3 },
            { attribute: "health", value: -2 },
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

    // 根据年龄增加健康危机概率
    let crisisChance = 0;
    if (age < 30) {
      crisisChance = 0.02; // 年轻人2%概率
    } else if (age < 60) {
      crisisChance = 0.03; // 成年人3%概率
    } else if (age < 100) {
      crisisChance = 0.05; // 老年人5%概率
    } else if (age < 160) {
      crisisChance = 0.08; // 超高龄8%概率
    } else {
      crisisChance = 0.12; // 极高龄12%概率
    }

    // 长寿天赋减少健康危机概率
    const hasLongevity = selectedTalents.some((t) => t.id === "longevity")
    if (hasLongevity) {
      crisisChance *= 0.7; // 降低30%危机概率
    }

    // 随机触发健康危机事件
    if (Math.random() < crisisChance) {
      let crisisEventPool: HealthCrisisEvent[] = [];
      
      if (age < 30) {
        crisisEventPool = healthCrisisEvents.youth;
      } else if (age < 60) {
        crisisEventPool = healthCrisisEvents.adult;
      } else if (age < 100) {
        crisisEventPool = healthCrisisEvents.elderly;
      } else if (age < 160) {
        crisisEventPool = healthCrisisEvents.superAge;
      } else {
        crisisEventPool = healthCrisisEvents.extremeAge;
      }
      
      const selectedCrisis = crisisEventPool[Math.floor(Math.random() * crisisEventPool.length)];
      
      // 记录事件
      const eventText = `${age}岁: ${selectedCrisis.text}`;
      setLifeEvents((prev) => [...prev, eventText]);
      
      // 判断是否死亡
      let deathRoll = Math.random();
      let deathChance = selectedCrisis.deathChance || 0;
      
      // 凤凰涅槃天赋降低死亡几率
      const hasPhoenixNirvana = selectedTalents.some((t) => t.id === "phoenix_nirvana")
      if (hasPhoenixNirvana) {
        deathChance *= 0.6; // 降低40%死亡概率
      }
      
      // 当健康值低于特定阈值时，死亡几率增加
      if (attributes.health < 5) {
        deathChance *= 1.5;
      }
      
      if (deathRoll < deathChance) {
        // 角色死亡
        setLifeEvents((prev) => [...prev, `  → 不幸的是，你没能挺过这次危机。`]);
        
        // 清除当前计时器并结束生命
        setShouldStartSimulation(false);
        endLife(age);
        return;
      }
      
      // 如果没有死亡，应用健康影响
      if (selectedCrisis.effect) {
        // 应用属性变化
        const newAttributes = { ...attributes };
        
        selectedCrisis.effect.forEach((effect) => {
          // 特殊天赋检查（凤凰涅槃等）
          let valueChange = effect.value;
          
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
        
        // 危机事件后添加恢复信息
        setLifeEvents((prev) => [...prev, `  → 你成功挺过了这次危机，但身体遭受了损伤。`]);
        return;
      }
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

    // 如果没有触发属性事件或健康危机，则触发普通事件
    const event = `${age}岁: ${events[Math.floor(Math.random() * events.length)]}`
    setLifeEvents((prev) => [...prev, event])

    // 150岁以后增加反老还童事件机会
    if (age >= 150 && Math.random() < 0.01) { // 1%概率
      // 记录反老还童事件
      const rejuvenationEvent = `${age}岁: 在一个神秘古老的仙山，你偶然发现了传说中的"长生不老泉"。`;
      setLifeEvents((prev) => [...prev, rejuvenationEvent]);
      
      // 创建符合ChoiceOption类型的选项
      const rejuvenationOptions: ChoiceOption[] = [
        {
          text: "饮下神泉，重新开始人生",
          effect: [
            { attribute: "intelligence" as AttributeType, value: 0 }, // 无实际效果，但需要placeholder
          ],
          isRejuvenation: true,
          isImmortalCultivation: true
        },
        {
          text: "将神泉装起来带回研究",
          effect: [
            { attribute: "intelligence" as AttributeType, value: 5 },
            { attribute: "wealth" as AttributeType, value: 10 },
          ]
        },
        {
          text: "感谢上天的礼物，但选择遵循自然规律",
          effect: [
            { attribute: "health" as AttributeType, value: 5 },
            { attribute: "luck" as AttributeType, value: 5 },
          ]
        }
      ];
      
      // 给第一个选项添加特殊标记
      (rejuvenationOptions[0] as any).isRejuvenation = true;
      
      // 暂停模拟并显示选择
      setSimulationPaused(true);
      setShouldStartSimulation(false);
      setCurrentChoice({
        question: "面对这传说中的神泉，你决定：",
        options: rejuvenationOptions
      });
      setGameState("choice");
      return;
    }
  }

  // 结束生命模拟
  const endLife = (finalAge: number, causeOverride?: string) => {
    // 确定死亡原因
    let deathCause = "";
    
    if (causeOverride) {
      // 如果有外部传入的死亡原因，优先使用
      deathCause = causeOverride;
    } else if (isImmortalCultivation && finalAge >= 1000) {
      // 修仙成功，飞升结局
      deathCause = "功德圆满，羽化成仙，飞升上界";
    } else {
      // 根据年龄和属性确定自然死亡原因
      if (finalAge >= 200) {
        deathCause = "寿终正寝，达到了人类的极限年龄";
      } else if (finalAge >= 150) {
        const causes = [
          "走完了漫长而传奇的一生",
          "在睡梦中平静地离世",
          "生命之火缓缓熄灭，创造了医学奇迹",
          "为人类的长寿研究贡献了最后的礼物"
        ];
        deathCause = causes[Math.floor(Math.random() * causes.length)];
      } else if (finalAge >= 100) {
        const causes = [
          "作为百岁老人，安详地闭上了眼睛",
          "在家人的陪伴下安详离世",
          "完成了人生最后的心愿后离开人世",
          "留下了丰富的人生经验和回忆"
        ];
        deathCause = causes[Math.floor(Math.random() * causes.length)];
      } else if (finalAge >= 70) {
        const causes = [
          "因自然衰老平静地离世",
          "在睡梦中离世",
          "心脏功能逐渐衰竭，离开人世",
          "多器官功能衰竭，终结了一生"
        ];
        deathCause = causes[Math.floor(Math.random() * causes.length)];
      } else if (finalAge >= 40) {
        if (attributes.health < 5) {
          const causes = [
            "长期健康问题最终导致器官衰竭",
            "不幸罹患重病，医治无效",
            "因慢性疾病恶化离世",
            "意外并发症导致医疗措施无效"
          ];
          deathCause = causes[Math.floor(Math.random() * causes.length)];
        } else {
          const causes = [
            "突发疾病，治疗无效",
            "在一场意外事故中不幸离世",
            "遭遇罕见疾病，医学尚无良方",
            "工作压力过大，突发心脏问题"
          ];
          deathCause = causes[Math.floor(Math.random() * causes.length)];
        }
      } else {
        // 年轻人死亡
        const causes = [
          "在一场意外事故中，生命过早结束",
          "罹患罕见疾病，医学无力挽救",
          "突发健康危机，抢救无效",
          "一场不幸的事件带走了年轻的生命"
        ];
        deathCause = causes[Math.floor(Math.random() * causes.length)];
      }
      
      // 根据属性调整死亡原因
      if (attributes.wealth >= 15 && finalAge < 100) {
        const wealthyCauses = [
          "在豪华别墅中安详离世，留下巨额财产",
          "最后一次慈善捐赠后心满意足地离开人世",
          "在私人医院接受最先进的治疗后仍未能挽回生命"
        ];
        if (Math.random() < 0.5) {
          deathCause = wealthyCauses[Math.floor(Math.random() * wealthyCauses.length)];
        }
      }
      
      if (attributes.intelligence >= 15 && finalAge < 100) {
        const smartCauses = [
          "在一项重大研究即将突破时不幸离世",
          "为科学事业耗尽心力，留下宝贵成果",
          "最后的理论著作尚未完成就离开人世"
        ];
        if (Math.random() < 0.5) {
          deathCause = smartCauses[Math.floor(Math.random() * smartCauses.length)];
        }
      }
    }
    
    // 添加死亡通知
    setLifeEvents((prev) => [...prev, `${finalAge}岁: 你${deathCause}，结束了此生的旅程。`]);
    
    // 计算得分和总结
    const totalScore = Object.values(attributes).reduce((sum, value) => sum + value, 0);
    
    // 创建得分级别评价
    let scoreLevel = "";
    if (isImmortalCultivation && finalAge >= 1000) {
      scoreLevel = "羽化登仙，超脱凡尘";
    } else if (totalScore >= 400) {
      scoreLevel = "神话般的传奇一生";
    } else if (totalScore >= 300) {
      scoreLevel = "辉煌卓越的一生";
    } else if (totalScore >= 200) {
      scoreLevel = "成功而充实的一生";
    } else if (totalScore >= 150) {
      scoreLevel = "平凡而满足的一生";
    } else if (totalScore >= 100) {
      scoreLevel = "普通的一生";
    } else if (totalScore >= 50) {
      scoreLevel = "遗憾的一生";
    } else {
      scoreLevel = "悲惨的一生";
    }
    
    // 添加生命总结
    setLifeEvents((prev) => [...prev, " "]);
    setLifeEvents((prev) => [...prev, "【生命总结】"]);
    setLifeEvents((prev) => [...prev, `寿命: ${finalAge}岁`]);
    setLifeEvents((prev) => [...prev, `智力: ${attributes.intelligence}`]);
    setLifeEvents((prev) => [...prev, `外貌: ${attributes.appearance}`]);
    setLifeEvents((prev) => [...prev, `财富: ${attributes.wealth}`]);
    setLifeEvents((prev) => [...prev, `健康: ${attributes.health}`]);
    setLifeEvents((prev) => [...prev, `幸运: ${attributes.luck}`]);
    setLifeEvents((prev) => [...prev, `总分: ${totalScore}`]);
    setLifeEvents((prev) => [...prev, `评价: ${scoreLevel}`]);
    
    // 生成职业
    let career = "";
    if (attributes.intelligence >= 15) {
      if (attributes.wealth >= 15) {
        career = "著名科学家/企业家";
      } else {
        career = "学者/研究员";
      }
    } else if (attributes.wealth >= 15) {
      if (attributes.appearance >= 15) {
        career = "成功商人/社交名流";
      } else {
        career = "企业家/投资者";
      }
    } else if (attributes.appearance >= 15) {
      career = "艺术家/演员";
    } else if (attributes.health >= 15) {
      career = "运动员/教练";
    } else {
      career = "普通职员/自由职业者";
    }
    
    // 生成人际关系
    let relationships = "";
    if (attributes.appearance >= 15 || attributes.luck >= 15) {
      relationships = "拥有广泛的社交圈，受人爱戴";
    } else if (attributes.intelligence >= 15) {
      relationships = "有几个志同道合的知己，关系深厚";
    } else if (attributes.wealth >= 15) {
      relationships = "社会地位较高，但真诚朋友较少";
    } else {
      relationships = "家人和朋友给予了足够的支持";
    }
    
    // 生成成就
    const achievements = [];
    
    if (attributes.intelligence >= 15) {
      achievements.push("在学术领域取得了显著成就");
    }
    if (attributes.wealth >= 15) {
      achievements.push("积累了可观的财富");
    }
    if (attributes.appearance >= 15) {
      achievements.push("因卓越的外表和魅力而闻名");
    }
    if (attributes.health >= 15) {
      achievements.push("保持了健康长寿的生活");
    }
    if (attributes.luck >= 15) {
      achievements.push("经历了许多幸运的转折点");
    }
    if (finalAge >= 100) {
      achievements.push("享有超过百年的传奇人生");
    }
    if (isImmortalCultivation && finalAge >= 1000) {
      achievements.push("修道成仙，飞升成功");
    }
    
    if (achievements.length === 0) {
      achievements.push("过着平凡但满足的生活");
    }
    
    // 更新summary状态
    setSummary({
      career,
      relationships,
      achievements,
      finalAge,
      deathCause
    });
    
    // 切换到总结状态
    setGameState("summary");
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

  // 做出选择
  const makeChoice = (effects: { attribute: AttributeType; value: number }[]) => {
    // 获取选中的选项
    const selectedOption = currentChoice?.options.find(opt => 
      JSON.stringify(opt.effect) === JSON.stringify(effects)
    );
    
    // 检查是否为修仙选项
    if (selectedOption && selectedOption.isImmortalCultivation) {
      // 记录选择
      const choiceEvent = `${currentAge}岁: 你选择了踏上修仙之路，追求超脱凡尘的境界。`;
      setLifeEvents((prev) => [...prev, choiceEvent]);
      
      // 特殊效果描述
      setLifeEvents((prev) => [...prev, `  → 你开始修炼不为人知的古老功法...`]);
      setLifeEvents((prev) => [...prev, `  → 你的体内渐渐有了一丝灵气流转！`]);
      setLifeEvents((prev) => [...prev, `  → 突破生死关，踏上长生路！`]);
      
      // 设置修仙状态
      setIsImmortalCultivation(true);
      
      // 设置第一次渡劫的年龄
      setNextTribulationAge(currentAge + 20); // 20年后第一次渡劫
      
      // 增加寿命上限
      setMaxAgeLimit(250);
      
      // 应用效果
      const newAttributes = { ...attributes };
      
      effects.forEach((effect) => {
        const newValue = Math.min(
          attributeCaps[effect.attribute],
          Math.max(1, newAttributes[effect.attribute] + effect.value)
        );
        newAttributes[effect.attribute] = newValue;
        
        // 显示属性变化
        const changeText = `  → ${attributeNames[effect.attribute]} ${effect.value > 0 ? "+" : ""}${effect.value}`;
        setLifeEvents((prev) => [...prev, changeText]);
      });
      
      setAttributes(newAttributes);
      
      // 恢复模拟
      setCurrentChoice(null);
      setGameState("events");
      
      // 确保所有状态更新后重新启动模拟
      setTimeout(() => {
        setSimulationPaused(false);
        setShouldStartSimulation(true);
      }, 100);
      
      return;
    }
    
    // 检查是否为反老还童选项
    if (selectedOption && selectedOption.isRejuvenation) {
      // 记录选择
      const choiceEvent = `${currentAge}岁: 你选择了饮下神泉，开始了新的人生旅程。`;
      setLifeEvents((prev) => [...prev, choiceEvent]);
      
      // 特殊效果描述
      setLifeEvents((prev) => [...prev, `  → 你的身体开始逆转衰老过程...`]);
      setLifeEvents((prev) => [...prev, `  → 你再次变回了婴儿，但保留了前世的所有能力和记忆！`]);
      
      // 设置状态为反老还童
      setTimeout(() => {
        // 重置年龄但保留属性
        setCurrentAge(0);
        // 添加分隔线
        setLifeEvents((prev) => [...prev, "【新的人生开始】"]);
        
        // 恢复模拟
        setCurrentChoice(null);
        setGameState("events");
        setSimulationPaused(false);
        setShouldStartSimulation(true);
      }, 100);
      
      return;
    }

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
          {gameState === "setup" && (
            <div className="text-xs text-muted-foreground mt-1">v1.0</div>
          )}
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
                <p className="text-muted-foreground mt-1">死亡原因: {summary.deathCause}</p>
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

