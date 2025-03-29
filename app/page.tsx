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

// 属性名称映射
const attributeNames: Record<AttributeType, string> = {
  intelligence: "智力",
  appearance: "外貌",
  wealth: "财富",
  health: "健康",
  luck: "幸运",
}

// 定义天赋效果详情类型
type AttributeBonus = {
  [key in AttributeType]?: {
    cap?: number; // 上限
    initial?: number; // 初始值
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
  immortal_cultivation_bonus?: boolean; // 修仙能力加成
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
  const [isMounted, setIsMounted] = useState(false)
  
  // 客户端渲染检查
  useEffect(() => {
    setIsMounted(true)
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
  const [lastRandomEventAge, setLastRandomEventAge] = useState(0) // 跟踪上次随机事件的年龄
  const [lastSkippedChoice, setLastSkippedChoice] = useState<{
    age: number;
    choice: {
      question: string;
      options: ChoiceOption[];
    } | null;
  } | null>(null) // 存储用户跳过的最后一个选择

  // 天赋列表
  const talents: Talent[] = [
    {
      id: "genius",
      name: "天生聪慧",
      description: "智力上限+20，初始智力+10",
      effect: {
        type: "attribute_bonus",
        details: { intelligence: { cap: 20, initial: 10 } },
      },
      rarity: "稀有",
      color: "bg-blue-500",
    },
    {
      id: "beauty",
      name: "天生丽质",
      description: "外貌上限+20，初始外貌+10",
      effect: {
        type: "attribute_bonus",
        details: { appearance: { cap: 20, initial: 10 } },
      },
      rarity: "稀有",
      color: "bg-pink-500",
    },
    {
      id: "wealthy_family",
      name: "富贵家庭",
      description: "财富上限+20，初始财富+10",
      effect: {
        type: "attribute_bonus",
        details: { wealth: { cap: 20, initial: 10 } },
      },
      rarity: "稀有",
      color: "bg-yellow-500",
    },
    {
      id: "strong_physique",
      name: "强健体魄",
      description: "健康上限+20，初始健康+10",
      effect: {
        type: "attribute_bonus",
        details: { health: { cap: 20, initial: 10 } },
      },
      rarity: "稀有",
      color: "bg-green-500",
    },
    {
      id: "fortune_star",
      name: "福星高照",
      description: "幸运上限+20，初始幸运+10",
      effect: {
        type: "attribute_bonus",
        details: { luck: { cap: 20, initial: 10 } },
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
      description: "所有属性上限+10，所有属性初始值+3",
      effect: {
        type: "attribute_bonus",
        details: {
          intelligence: { cap: 10, initial: 3 },
          appearance: { cap: 10, initial: 3 },
          wealth: { cap: 10, initial: 3 },
          health: { cap: 10, initial: 3 },
          luck: { cap: 10, initial: 3 },
        },
      },
      rarity: "史诗",
      color: "bg-slate-500",
    },
    {
      id: "immortal_aptitude",
      name: "仙道资质",
      description: "天生仙骨灵根，解锁专属仙道机缘",
      effect: {
        type: "special",
        details: { immortal_cultivation_bonus: true },
      },
      rarity: "传说",
      color: "bg-violet-500",
    },
    {
      id: "ancient_wisdom",
      name: "远古智慧",
      description: "获得上古修仙者的完整传承，智力和健康初上限+20，解锁专属秘法事件",
      effect: {
        type: "attribute_bonus",
        details: {
          intelligence: { cap: 20, initial: 0 },
          health: { cap: 20, initial: 0 },
          luck: { cap: 10, initial: 0 },
        },
      },
      rarity: "史诗",
      color: "bg-teal-500",
    },
  ]

  const attributeIcons = {
    intelligence: Brain,
    appearance: Smile,
    wealth: Coins,
    health: Heart,
    luck: Award,
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
        
        console.log(`模拟年龄增长：${newAge}岁, 修仙状态: ${isImmortalCultivation}, 下次渡劫年龄: ${nextTribulationAge}`); // 调试日志

        // 检查是否需要渡劫（修仙状态下）
        if (isImmortalCultivation && newAge === nextTribulationAge && nextTribulationAge > 0) {
          // 暂停模拟并触发渡劫
          setSimulationPaused(true)
          setShouldStartSimulation(false)
          
          // 渡劫成功率计算：随着年龄增加，基础成功率提高
          // 初始50%，每次渡劫降低2%，但高属性可以提高成功率
          const baseSuccessRate = 0.5;
          const tribulationPenalty = tribulationsCount * 0.02;
          
          // 检查是否有仙道资质天赋
          const hasImmortalAptitude = selectedTalents.some((t) => t.id === "immortal_aptitude");
          const immortalBonus = hasImmortalAptitude ? 0.25 : 0; // 仙道资质天赋提供25%的渡劫成功率加成（从15%提高）
          
          // 检查是否有远古智慧天赋
          const hasAncientWisdom = selectedTalents.some((t) => t.id === "ancient_wisdom");
          const wisdomBonus = hasAncientWisdom ? 0.20 : 0; // 远古智慧天赋提供20%的渡劫成功率加成
          
          const attrBonus = (attributes.intelligence * 0.003 + attributes.health * 0.002 + attributes.luck * 0.001);
          const successRate = Math.max(0.05, Math.min(0.95, baseSuccessRate - tribulationPenalty + attrBonus + immortalBonus + wisdomBonus));
          
          console.log(`渡劫计算 - 基础成功率: ${baseSuccessRate}, 渡劫次数惩罚: ${tribulationPenalty}, 属性加成: ${attrBonus}, 仙道资质加成: ${immortalBonus}, 远古智慧加成: ${wisdomBonus}, 最终成功率: ${successRate}`);
          
          const isSuccess = Math.random() < successRate
          
          if (isSuccess) {
            // 渡劫成功
            setLifeEvents((prev) => [
              ...prev, 
              `${newAge}岁: 【渡劫】第${tribulationsCount + 1}次渡劫，天空电闪雷鸣...`,
              `  → 你成功渡过天劫，修为更进一步！`,
              `  → 寿命增加50年！`
            ])
            
            // 更新下一次渡劫年龄，设为固定每50年一次
            setTribulationsCount((prev) => prev + 1)
            setNextTribulationAge((prev) => prev + 50) // 每50年渡劫一次
            
            // 增加寿命上限，确保能达到1000岁
            const newMaxAgeLimit = Math.min(1000, maxAgeLimit + 50);
            setMaxAgeLimit(newMaxAgeLimit);
            
            console.log(`渡劫成功 - 新的寿命上限: ${newMaxAgeLimit}, 下次渡劫年龄: ${nextTribulationAge + 50}, 渡劫次数: ${tribulationsCount + 1}`);
            
            // 属性加成，如果有仙道资质天赋，获得更多属性提升
            const intelligenceBonus = hasImmortalAptitude ? 15 : (hasAncientWisdom ? 12 : 5);
            const healthBonus = hasImmortalAptitude ? 15 : (hasAncientWisdom ? 12 : 5);
            const luckBonus = hasImmortalAptitude ? 10 : (hasAncientWisdom ? 8 : 3);
            const appearanceBonus = hasImmortalAptitude ? 8 : (hasAncientWisdom ? 6 : 0);
            const wealthBonus = hasImmortalAptitude ? 8 : (hasAncientWisdom ? 6 : 0);
            
            if (hasImmortalAptitude) {
              setLifeEvents((prev) => [
                ...prev,
                `  → 【仙道资质】天赋发挥超凡效果，你的修为呈几何级数增长！`
              ]);
            }
            
            if (hasAncientWisdom && !hasImmortalAptitude) {
              setLifeEvents((prev) => [
                ...prev,
                `  → 【远古智慧】天赋启迪，你深刻理解了天劫之道，获益匪浅！`
              ]);
            }
            
            setAttributes((prev) => ({
              ...prev,
              intelligence: Math.min(100, prev.intelligence + intelligenceBonus),
              health: Math.min(100, prev.health + healthBonus),
              luck: Math.min(100, prev.luck + luckBonus),
              appearance: Math.min(100, prev.appearance + appearanceBonus),
              wealth: Math.min(100, prev.wealth + wealthBonus)
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
        else if (newAge === 190) {
          // 添加日志
          console.log("已达到190岁，提供修仙选择");
          
          // 暂停模拟
          setSimulationPaused(true);
          setShouldStartSimulation(false);
          
          // 清除当前计时器
          if (timerID) {
            clearInterval(timerID);
            timerID = null;
          }
          
          // 呈现选择
          presentChoice(newAge);
          return newAge;
        } 
        else if (newAge === 12 || newAge === 18 || newAge === 25 || newAge === 35 || newAge === 50 || 
                newAge === 65 || newAge === 80 || newAge === 95 ||
                (newAge >= 110 && newAge % 15 === 0 && newAge < 200) || 
                (isImmortalCultivation && (newAge === 210 || (newAge >= 300 && newAge % 100 === 0 && newAge < 900) || newAge === 990))) {
          // 110岁后每15年一次选择，修仙后在210岁、每100岁和990岁增加选择点
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
        // 添加随机选择事件
        else if (newAge >= 10 && newAge < 200 && !isImmortalCultivation && 
                 Math.random() < 0.03 && // 降低到3%的几率
                 (newAge % 5 === 0 || newAge % 5 === 1) && // 只在能被5整除或余1的年龄触发，进一步限制频率
                 lastRandomEventAge + 5 <= newAge) { // 确保与上次随机事件至少间隔5岁
          console.log(`触发随机选择事件，年龄: ${newAge}岁`);
          
          // 记录这次随机事件的年龄
          setLastRandomEventAge(newAge);
          
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
          
          // 检查是否有仙道资质天赋
          const hasImmortalAptitude = selectedTalents.some((t) => t.id === "immortal_aptitude");
          
          // 更改随机逻辑，提高存活概率，确保高属性角色能活到190岁
          if (Math.random() > superAgeChance * 1.5 && !hasImmortalAptitude) { // 降低死亡概率，但有仙道资质的不会受影响
            maxAge = Math.min(maxAge, newAge + 10 + Math.floor(Math.random() * 20)); // 增加额外的10-30年寿命
          } else {
            // 确保有机会达到190岁
            maxAge = Math.max(maxAge, 190); // 提高最低寿命保证至190岁
            
            // 添加日志
            if (newAge === 100) {
              console.log("高寿命计算: 提高存活年龄上限至" + maxAge);
            }
          }
          
          // 特别处理接近190岁的情况
          if (newAge >= 180 && newAge < 190) {
            // 确保能活到190岁
            maxAge = Math.max(maxAge, 195);
            
            // 添加日志
            console.log(`接近190岁: 确保能够达到修仙选择年龄，设置寿命上限为${maxAge}`);
          }
          
          // 如果有仙道资质，确保一定能活到190岁以上
          if (hasImmortalAptitude) {
            maxAge = Math.max(maxAge, 195); // 至少能活到195岁
            console.log(`【仙道资质】影响: 提高寿命至少到${maxAge}岁，确保能达到修仙选择年龄`);
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

  // 获取高龄问题和选项
  const getHighAgeQuestion = (age: number): string => {
    const questions = [
      `${age}岁高龄的你，健康状况奇迹般地良好，是否要尝试挑战极限？`,
      `${age}岁的你已经见证了太多历史变迁，如何度过接下来的时光？`,
      `${age}岁的你被医学界视为研究奇迹，如何应对这种关注？`,
      `已经${age}岁的你，对生命有了怎样的新认识？`
    ]
    return questions[Math.floor(Math.random() * questions.length)]
  }
  
  const getHighAgeOptions = (age: number): ChoiceOption[] => {
    return [
      {
        text: "参与长寿研究项目，为医学进步贡献力量",
                effect: [
          { attribute: "intelligence" as AttributeType, value: 2 },
          { attribute: "health" as AttributeType, value: -1 },
        ],
      },
      {
        text: "尝试新的养生方法，追求更高寿命",
                effect: [
          { attribute: "health" as AttributeType, value: 3 },
          { attribute: "wealth" as AttributeType, value: -1 },
        ],
      },
      {
        text: "记录人生经历，留下宝贵历史见证",
                effect: [
          { attribute: "intelligence" as AttributeType, value: 3 },
          { attribute: "appearance" as AttributeType, value: 1 },
        ],
      },
    ]
  }
  
  // 获取随机选择事件
  const getRandomChoiceEvent = (age: number): { question: string; options: ChoiceOption[] } => {
    const randomEvents = [
      {
        question: "面对人生的挑战",
            options: [
              {
            text: "勇敢面对，迎难而上",
                effect: [
              { attribute: "health" as AttributeType, value: 2 },
              { attribute: "luck" as AttributeType, value: 2 },
            ],
          },
          {
            text: "谨慎规划，稳妥应对",
                effect: [
              { attribute: "intelligence" as AttributeType, value: 3 },
              { attribute: "wealth" as AttributeType, value: 1 },
            ],
          },
          {
            text: "寻求帮助，团队合作",
                effect: [
              { attribute: "appearance" as AttributeType, value: 2 },
              { attribute: "luck" as AttributeType, value: 2 },
            ],
          },
        ],
      },
      {
        question: "生活需要新的方向",
            options: [
              {
            text: "专注于健康与长寿",
                effect: [
              { attribute: "health" as AttributeType, value: 4 },
              { attribute: "intelligence" as AttributeType, value: 1 },
            ],
          },
          {
            text: "追求财富与成就",
                effect: [
              { attribute: "wealth" as AttributeType, value: 3 },
              { attribute: "appearance" as AttributeType, value: 1 },
            ],
          },
          {
            text: "享受生活，追求幸福",
                effect: [
              { attribute: "luck" as AttributeType, value: 3 },
              { attribute: "health" as AttributeType, value: 2 },
            ],
          },
        ],
      },
    ]
    return randomEvents[Math.floor(Math.random() * randomEvents.length)]
  }

  // 生成事件
  const generateEvent = (age: number) => {
    // 根据年龄生成事件或提供选择
    if (age === 12 || age === 18 || age === 25 || age === 35 || age === 50 || age === 190 || 
        (age >= 110 && age < 200)) {
      presentChoice(age)
        } else {
      // 如果用户有天命之子天赋
      const hasChosenOne = selectedTalents.some((t) => t.id === "destiny_child")
      // 特定年龄可能会触发特殊选择
      if (hasChosenOne && (age === 22 || age === 42 || age === 70 || age === 100)) {
        presentSpecialChoice(age)
        } else {
        // 根据属性和年龄构建随机事件
        // ...
      }
    }
  }

  // 提供普通选择
  const presentChoice = (age: number) => {
    let question: string
    let options: ChoiceOption[]

    // 根据年龄决定问题和选项
    switch(age) {
      case 12:
        question = "12岁，你即将步入青少年时期："
        options = [
          {
            text: "专注学习，为将来做准备",
            effect: [
              { attribute: "intelligence", value: 3 },
              { attribute: "health", value: -1 },
            ],
          },
          {
            text: "参加体育活动，锻炼身体",
            effect: [
              { attribute: "health", value: 3 },
              { attribute: "intelligence", value: -1 },
            ],
          },
          {
            text: "社交活动，结交更多朋友",
            effect: [
              { attribute: "appearance", value: 2 },
              { attribute: "luck", value: 2 },
            ],
          },
        ]
        break

      case 18:
        question = "18岁，你即将迈入成年："
        options = [
          {
            text: "进入大学深造",
            effect: [
              { attribute: "intelligence", value: 4 },
              { attribute: "wealth", value: -2 },
            ],
          },
          {
            text: "直接就业，积累经验",
            effect: [
              { attribute: "wealth", value: 3 },
              { attribute: "intelligence", value: 1 },
            ],
          },
          {
            text: "创业尝试，寻找机会",
            effect: [
              { attribute: "luck", value: 3 },
              { attribute: "wealth", value: 2 },
              { attribute: "health", value: -1 },
            ],
          },
        ]
        break

      case 25:
        question = "25岁，人生的关键决策期："
            options = [
              {
            text: "专注事业发展，提升职场竞争力",
                effect: [
              { attribute: "wealth", value: 4 },
              { attribute: "intelligence", value: 3 },
              { attribute: "health", value: -1 },
                ],
              },
              {
            text: "平衡工作与生活，追求身心健康",
                effect: [
                  { attribute: "health", value: 3 },
              { attribute: "luck", value: 2 },
              { attribute: "wealth", value: 1 },
                ],
              },
              {
            text: "放下一切去旅行，拓展视野",
                effect: [
              { attribute: "appearance", value: 3 },
              { attribute: "luck", value: 3 },
              { attribute: "wealth", value: -2 },
                ],
              },
            ]
        break
        
      case 35:
        question = "35岁，事业与家庭的平衡点："
            options = [
              {
            text: "全力投入事业，争取更大成就",
                effect: [
              { attribute: "wealth", value: 5 },
              { attribute: "intelligence", value: 3 },
              { attribute: "health", value: -2 },
                ],
              },
              {
            text: "注重家庭生活，培养亲密关系",
                effect: [
              { attribute: "health", value: 2 },
              { attribute: "luck", value: 3 },
                  { attribute: "appearance", value: 1 },
                ],
              },
              {
            text: "寻找新的职业方向，突破舒适区",
                effect: [
              { attribute: "intelligence", value: 4 },
              { attribute: "wealth", value: -1 },
              { attribute: "luck", value: 3 },
                ],
              },
            ]
        break
        
      case 50:
        question = "50岁，人生的黄金时期："
            options = [
              {
            text: "利用积累的经验和资源回馈社会",
                effect: [
              { attribute: "luck", value: 4 },
              { attribute: "appearance", value: 2 },
              { attribute: "wealth", value: -1 },
                ],
              },
              {
            text: "提前规划退休生活，为晚年做准备",
                effect: [
              { attribute: "wealth", value: 3 },
                  { attribute: "health", value: 2 },
                  { attribute: "intelligence", value: 1 },
                ],
              },
              {
            text: "开创人生第二事业，追求新的成就",
                effect: [
              { attribute: "intelligence", value: 3 },
              { attribute: "wealth", value: 3 },
              { attribute: "health", value: -1 },
                ],
              },
            ]
        break
      
      // 特殊处理190岁的情况，确保总是展示修仙选项
      case 190:
        question = "190岁的你站在人类极限的边缘，科学无法解释你的存在，是继续安享晚年，还是追求更高的境界？"
            options = [
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
        break

      // 对于110岁以上到200岁以下的年龄，使用随机选项或高龄选项，但排除190岁
      default:
        if (age >= 110 && age < 200 && age !== 190) {
          // 对于这些高龄，50%概率使用随机选项（降低比例）
          if (Math.random() < 0.5) {
            const randomEvent = getRandomChoiceEvent(age);
            question = `${age}岁: ${randomEvent.question}`;
            options = randomEvent.options;
          } else {
            question = getHighAgeQuestion(age)
            options = getHighAgeOptions(age)
          }
        } else {
          // 200岁以上或其他特定年龄使用原有的高龄选项
          question = getHighAgeQuestion(age)
          options = getHighAgeOptions(age)
        }
    }

    // 确保问题描述包含年龄
    if (!question.startsWith(`${age}岁`)) {
      question = `${age}岁: ${question}`;
    }

    // 设置当前选择
    setCurrentChoice({
      question,
      options,
    })

    // 切换到选择界面
    setGameState("choice")
  }

  // 重新开始游戏
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
    setLastRandomEventAge(0)
    setLastSkippedChoice(null)
  }

  // 结束生命函数
  const endLife = (finalAge: number, causeOverride?: string) => {
    // 确定死亡原因
    let deathCause = causeOverride || "自然衰老，平静离世"
    
    // 添加死亡通知
    setLifeEvents((prev) => [...prev, `${finalAge}岁: 你${deathCause}，结束了此生的旅程。`])
    
    // 计算得分和总结
    const totalScore = Object.values(attributes).reduce((sum, value) => sum + value, 0)
    
    // 创建得分级别评价
    let scoreLevel = ""
    if (isImmortalCultivation && finalAge >= 1000) {
      scoreLevel = "羽化登仙，超脱凡尘"
    } else if (totalScore >= 400) {
      scoreLevel = "神话般的传奇一生"
    } else if (totalScore >= 300) {
      scoreLevel = "辉煌卓越的一生"
    } else if (totalScore >= 200) {
      scoreLevel = "成功而充实的一生"
    } else if (totalScore >= 150) {
      scoreLevel = "平凡而满足的一生"
    } else if (totalScore >= 100) {
      scoreLevel = "普通的一生"
    } else if (totalScore >= 50) {
      scoreLevel = "遗憾的一生"
    } else {
      scoreLevel = "悲惨的一生"
    }
    
    // 添加生命总结
    setLifeEvents((prev) => [...prev, " "])
    setLifeEvents((prev) => [...prev, "【生命总结】"])
    setLifeEvents((prev) => [...prev, `寿命: ${finalAge}岁`])
    setLifeEvents((prev) => [...prev, `智力: ${attributes.intelligence}`])
    setLifeEvents((prev) => [...prev, `外貌: ${attributes.appearance}`])
    setLifeEvents((prev) => [...prev, `财富: ${attributes.wealth}`])
    setLifeEvents((prev) => [...prev, `健康: ${attributes.health}`])
    setLifeEvents((prev) => [...prev, `幸运: ${attributes.luck}`])
    setLifeEvents((prev) => [...prev, `总分: ${totalScore}`])
    setLifeEvents((prev) => [...prev, `评价: ${scoreLevel}`])
    
    // 切换到总结状态
    setGameState("summary")
  }
  
  // 做出选择
  const makeChoice = (effects: { attribute: AttributeType; value: number }[]) => {
    // 应用选择的效果
    const newAttributes = { ...attributes }

    effects.forEach((effect) => {
      // 应用效果，但不超过上限
      const newValue = Math.min(
        attributeCaps[effect.attribute],
        Math.max(1, newAttributes[effect.attribute] + effect.value),
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
      const changeText = `${attributeNames[effect.attribute]} ${effect.value > 0 ? "+" : ""}${effect.value}`
      setLifeEvents((prev) => [...prev, `  → ${changeText}`])
    })

    // 恢复模拟
    setCurrentChoice(null)
    setGameState("events")
    
    setTimeout(() => {
      setSimulationPaused(false)
      setShouldStartSimulation(true)
    }, 100)
  }
  
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
    }

    setCurrentChoice({
      question,
      options
    })
    
    setGameState("choice")
  }

  // 如果不是客户端环境，返回一个加载中的UI
  if (!isMounted) {
    return (
      <div className="container max-w-3xl mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <p className="text-xl font-medium text-center">正在加载人生重开模拟器...</p>
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
            <div className="text-xs text-muted-foreground mt-1">v1.5</div>
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
              {lastSkippedChoice && simulationPaused === false && (
                <Button 
                  className="mt-2" 
                  onClick={() => {
                    // 恢复上次跳过的选择
                    setGameState("choice");
                    setSimulationPaused(true);
                  }}
                >
                  返回选择
                </Button>
              )}
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
            
            // 不要在关闭选项框时立即重启模拟，而是添加一个重新选择的提示
            setLifeEvents((prev) => [...prev, `【提示】你关闭了选择框，可以点击"返回选择"按钮继续。`]);
            
            // 将当前选择保存起来，以便后续可以重新打开
            setLastSkippedChoice({
              age: currentAge,
              choice: currentChoice
            });
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

