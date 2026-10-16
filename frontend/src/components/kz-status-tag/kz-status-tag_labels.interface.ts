import { KzTone } from '../../models/kz_tone.enum';


export interface KzStatusLabels {
    label: Record<string, string>;
    tone: Record<string, KzTone>;
}
