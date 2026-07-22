<script setup lang="ts">
import { computed } from 'vue'
import MatchingGame from './matching-game.vue'
import PerceptionChallengeGame from './perception-challenge-game.vue'
import InteractiveDiagramGame from './interactive-diagram-game.vue'
import PatternPickGame from './tile-matching-game.vue'
import BrandSimulatorGame from './brand-simulator-game.vue'
import DragBuildGame from './drag-build-game.vue'
import RotatePuzzleGame from './rotate-puzzle-game.vue'
import PointPlacementGame from './point-placement-game.vue'
import StylistOutfitGame from './StylistOutfitGame.vue'
import ProportionsLandmarkGame from './ProportionsLandmarkGame.vue'
import ColorMasterGame from './ColorMasterGame.vue'
import SlashSpreadGame from './SlashSpreadGame.vue'
import RepeatBuilderGame from './RepeatBuilderGame.vue'

const props = defineProps<{
  game: {
    type: string
    title?: string
    instructions?: string
    config: any
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

function onFinished(score: number) {
  emit('finished', score)
}

const gameType = computed(() => props.game?.type || '')
</script>

<template>
  <div class="game-runner">
    <h3 v-if="game.title" class="game-title">{{ game.title }}</h3>
    <p v-if="game.instructions" class="game-instructions">{{ game.instructions }}</p>

    <!-- Matching Game -->
    <MatchingGame
      v-if="gameType === 'matching'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Perception Challenge -->
    <PerceptionChallengeGame
      v-else-if="gameType === 'perception_challenge'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Interactive Diagram / Slider Spread -->
    <InteractiveDiagramGame
      v-else-if="gameType === 'interactive_diagram' || gameType === 'slider_spread'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Pattern Pick (tile matching) -->
    <PatternPickGame
      v-else-if="gameType === 'pattern_pick' || gameType === 'tile_matching'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Brand Simulator -->
    <BrandSimulatorGame
      v-else-if="gameType === 'brand_simulator'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Drag Build (croquis builder) -->
    <DragBuildGame
      v-else-if="gameType === 'ordering_game' || gameType === 'drag_build'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Rotate Puzzle (dart pivot puzzle) -->
    <RotatePuzzleGame
      v-else-if="gameType === 'rotate_puzzle'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Point Placement (landmark points) -->
    <PointPlacementGame
      v-else-if="gameType === 'point_placement'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Proportions Landmarks Game (Stage 2) -->
    <ProportionsLandmarkGame
      v-else-if="gameType === 'proportions_landmarks'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Color Master Game (Stage 3) -->
    <ColorMasterGame
      v-else-if="gameType === 'color_master'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Slash Spread Game (Stage 6) -->
    <SlashSpreadGame
      v-else-if="gameType === 'slash_spread'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Stylist Outfit Game (Stage 1) -->
    <StylistOutfitGame
      v-else-if="gameType === 'stylist_outfit'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Repeat Builder Game (Stage 7) -->
    <RepeatBuilderGame
      v-else-if="gameType === 'repeat_builder'"
      :config="game.config"
      @finished="onFinished"
    />

    <!-- Fallback for unknown types -->
    <div v-else class="game-fallback">
      <p>Bu o'yin turi hali yuklanmagan.</p>
      <button class="btn-primary btn-block" @click="onFinished(100)">Davom etish</button>
    </div>
  </div>
</template>

<style scoped>
.game-runner {
  margin-top: 8px;
}
.game-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.game-instructions {
  font-size: 0.95rem;
  color: var(--muted, #6b7280);
  margin-bottom: 10px;
}
</style>
