<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/panel"></ion-back-button>
        </ion-buttons>
        <ion-title>Ruleta de Estudiantes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Ruleta de Estudiantes</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Initial State: No spin yet -->
      <ion-card v-if="!spinning && !winner && !hasMarshaled">
        <ion-card-header>
          <ion-card-title>Ruleta de Estudiantes</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p v-if="!selectedCourseId">Por favor, selecciona un curso para empezar.</p>
          <ion-button expand="block" @click="spinRoulette" :disabled="!students.length || !selectedCourseId">
            <ion-icon slot="start" :icon="playOutline"></ion-icon>
            Girar Ruleta
          </ion-button>
          
          <div class="ion-margin-top" v-if="selectedCourseId">
              <ion-button fill="outline" expand="block" @click="openSelectionModal">
                Cambiar Curso
              </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Spinning or Winner State -->
      <ion-card v-else>
        <ion-card-header>
          <ion-card-title>{{ spinning ? 'Girando...' : '¡Ganador!' }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          
          <!-- Roulette Window -->
          <div class="roulette-window">
            <div class="roulette-strip" :style="stripStyle">
                <div v-for="(student, index) in rouletteItems" :key="index" class="roulette-item">
                    {{ student.lastName }} {{ student.name }}
                </div>
            </div>
            <!-- Center Highlight Line (Optional visual aid) -->
            <div class="roulette-highlight"></div>
          </div>

          <!-- Controls below roulette -->
          <div class="controls-container" v-if="!spinning && winner">
             <h2 class="winner-name">{{ winner.lastName }} {{ winner.name }}</h2>
             <div class="action-buttons">
                <ion-button expand="block" @click="spinRoulette">
                    <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
                    Girar de nuevo
                </ion-button>
                <ion-button fill="outline" expand="block" @click="openSelectionModal">
                    Cambiar Curso
                </ion-button>
             </div>
          </div>

        </ion-card-content>
      </ion-card>

      <!-- Modal for Course and Year Selection -->
      <ion-modal
        :is-open="isSelectionModalOpen"
        @didDismiss="handleSelectionModalDismiss"
        :backdrop-dismiss="false"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>Selecciona Curso y Año</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="confirmSelection" :disabled="!selectedCourseId">Confirmar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Año</ion-label>
            <ion-select
              v-model="selectedYear"
              placeholder="Seleccione el año"
              @ionChange="getCourses"
            >
              <ion-select-option v-for="year in years" :key="year" :value="year">
                {{ year }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Curso</ion-label>
            <ion-select
              v-model="selectedCourseId"
              placeholder="Seleccione un curso"
              :disabled="!courses.length"
              @ionChange="getStudents"
            >
              <ion-select-option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonModal,
} from "@ionic/vue";
import { defineComponent, ref, onMounted } from "vue";
import { playOutline, refreshOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, usuarioGet, currentServerYear } from "../globalService";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "RuletaPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonModal,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(null);
    const isSelectionModalOpen = ref(true);
    const selectedYear = ref(currentServerYear());
    const years = ref([]);
    const courses = ref([]);
    const selectedCourseId = ref(null);
    const students = ref([]);
    
    // Roulette State
    const spinning = ref(false);
    const winner = ref(null);
    const hasMarshaled = ref(false); // Valid flag to show the game UI instead of initial button
    const rouletteItems = ref([]);
    const stripStyle = ref({});

    // Constants for visuals
    const ITEM_HEIGHT = 50; // pixels
    const VISIBLE_ITEMS = 3; 

    const generateYears = () => {
      const currentYear = currentServerYear();
      years.value = Array.from({ length: 10 }, (_, i) => currentYear - i);
    };

    const getCourses = async () => {
      if (!usuario.value || !usuario.value.institute || !selectedYear.value) {
        courses.value = [];
        selectedCourseId.value = null;
        students.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute.id}&exist=true`, 
          tokenHeader()
        );
        courses.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
        selectedCourseId.value = null;
        students.value = [];
      } catch (error) {
        console.error("Error fetching courses:", error);
        courses.value = [];
      }
    };

    const getStudents = async () => {
      if (!selectedCourseId.value) {
        students.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `/courses/${selectedCourseId.value}/users?year=${selectedYear.value}&active=true`,
          tokenHeader()
        );
        students.value = response.data
          .filter((assignment) => assignment.rol === 'student' || assignment.rol === 'user')
          .map((assignment) => assignment.user)
          .sort((a, b) => {
            const lastNameA = a.lastName || "";
            const lastNameB = b.lastName || "";
            if (lastNameA !== lastNameB) {
              return lastNameA.localeCompare(lastNameB);
            }
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
          });
      } catch (error) {
        console.error("Error fetching students:", error);
        students.value = [];
      }
    };

    const confirmSelection = async () => {
      if (selectedCourseId.value) {
        await getStudents();
        isSelectionModalOpen.value = false;
        // If we have data, we can unlock the UI or let them click Spin
      }
    };
    
    const openSelectionModal = () => {
        isSelectionModalOpen.value = true;
    };

    const handleSelectionModalDismiss = () => {
       // Only go back if we really have nothing selected or cancelling initial load
       // If user clicks "Change Course" and then cancels (click outside), we just stay
       if (!selectedCourseId.value && isSelectionModalOpen.value) {
         router.back();
       } else {
           // just close
           isSelectionModalOpen.value = false;
       }
    };

    const spinRoulette = () => {
      if (!students.value.length) return;

      spinning.value = true;
      winner.value = null;
      hasMarshaled.value = true; 

      const totalStudents = students.value.length;
      const targetIndex = Math.floor(Math.random() * totalStudents);
      const targetStudent = students.value[targetIndex];

      // Build the strip
      // We want the strip to fall DOWN. 
      // This means we view the bottom initially and animate to view the top.
      // List: [Winner, ...Randoms... , Randoms (Start View)]
      
      const numberOfFillers = 40; // Enough to spin for ~2s
      const fillerStudents = [];
      
      for (let i = 0; i < numberOfFillers; i++) {
          const randomIndex = Math.floor(Math.random() * totalStudents);
          fillerStudents.push(students.value[randomIndex]);
      }
      
      // Structure: [Winner (plus neighbors for context), ...fillers]
      // When we land, we want Winner centered.
      // Let's say window shows 3 items. Winner is item index 1 (center).
      // So we need: [Neighbor, Winner, Neighbor, ...fillers]
      
      const prevIndex = (targetIndex - 1 + totalStudents) % totalStudents;
      const nextIndex = (targetIndex + 1) % totalStudents;
      
      const finalView = [
          students.value[prevIndex], 
          targetStudent, 
          students.value[nextIndex]
      ];
      
      // Full list
      const fullList = [...finalView, ...fillerStudents];
      
      rouletteItems.value = fullList;
      
      // Height calcs
      const totalHeight = fullList.length * ITEM_HEIGHT;
      // We start by viewing the BOTTOM of the list.
      // Offset should be such that the bottom-most items are visible.
      // To view the bottom of a list in a window of 150px (3 items):
      // translateY should be -(totalHeight - 150)
      
      const windowHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
      const startOffset = -(totalHeight - windowHeight);
      const endOffset = 0; // View the top (Winner is at index 1, which is center of top 3)

      // Duration configuration
      const SPIN_DURATION_MS = 9000;
      const SPIN_DURATION_SEC = SPIN_DURATION_MS / 1000;

      // 1. Set initial position immediately (no transition)
      stripStyle.value = {
          transform: `translateY(${startOffset}px)`,
          transition: 'none'
      };

      // 2. Trigger animation after reflow
      setTimeout(() => {
          stripStyle.value = {
              transform: `translateY(${endOffset}px)`,
              transition: `transform ${SPIN_DURATION_SEC}s cubic-bezier(0.1, 0.7, 0.1, 1)` // Ease out, fast start slow end
          };
      }, 50);

      // 3. End Spin
      setTimeout(() => {
          winner.value = targetStudent;
          spinning.value = false;
      }, SPIN_DURATION_MS + 50); // Slightly after transition
    };

    onMounted(async () => {
      usuario.value = usuarioGet();
      generateYears();
      await getCourses(); 
    });

    return {
      playOutline,
      refreshOutline,
      isSelectionModalOpen,
      selectedYear,
      years,
      courses,
      selectedCourseId,
      students,
      spinning,
      winner,
      hasMarshaled,
      rouletteItems,
      stripStyle,
      getCourses,
      getStudents,
      confirmSelection,
      openSelectionModal,
      handleSelectionModalDismiss,
      spinRoulette,
    };
  },
});
</script>

<style scoped>
.roulette-window {
  height: 150px; /* 3 items * 50px */
  overflow: hidden;
  position: relative;
  background: #f4f5f8;
  border-radius: 8px;
  border: 4px solid var(--ion-color-primary, #3880ff);
  margin-bottom: 20px;
}

.roulette-strip {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.roulette-item {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #ddd;
  background: white;
  box-sizing: border-box;
}

.roulette-highlight {
  position: absolute;
  top: 50px; /* offset by 1 item height */
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(56, 128, 255, 0.2);
  pointer-events: none;
  border-top: 2px solid var(--ion-color-primary, #3880ff);
  border-bottom: 2px solid var(--ion-color-primary, #3880ff);
  box-sizing: border-box;
}

.winner-name {
    text-align: center;
    color: var(--ion-color-success, #2dd36f);
    font-size: 1.8rem;
    margin: 10px 0;
    font-weight: 900;
}

.controls-container {
    text-align: center;
    animation: fadeIn 0.5s ease-in;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
