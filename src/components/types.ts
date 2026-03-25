export enum AvailableComponentsEnum {
  PortraitVideo = "ShortVideo",
  LandscapeVideo = "LandscapeVideo",
  LongFormVideo = "LongFormVideo",
}
export type OrientationConfig = {
  width: number;
  height: number;
  component: AvailableComponentsEnum;
};
