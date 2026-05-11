export type OtherOptionGroup =
  | "gameType"
  | "gameComposition"
  | "gender"
  | "openFor";

export type SearchFilters = {
  query?: string;
  terms?: string[];
  from?: string;
  to?: string;
  onlyWeekend?: boolean;
  clubIds?: string[];
  districtId?: string | null;
  classification?: string | null;
  gameType?: string[];
  gameComposition?: string[];
  gender?: string[];
  openFor?: string[];
  page?: number;
};

export type ClubOption = {
  id: string;
  name: string;
  districtId?: string;
};

export type DistrictOption = {
  id: string;
  name: string;
};

export type ClassificationOption = {
  groupName: string;
  name: string;
  fullName: string;
};

export type OtherOption = {
  id: string;
  name: string;
};

export type SearchOverview = {
  clubs: ClubOption[];
  districts: DistrictOption[];
  classifications: ClassificationOption[];
  otherOptions: Record<OtherOptionGroup, OtherOption[]>;
};

export type CompetitionSummary = {
  id: string;
  name: string;
  startDate: string;
  clubName: string;
  clubId?: string;
  districtId?: string;
  courseName?: string;
  gameFormat?: string;
  isFollowed?: boolean;
  minGolfUrl: string;
};

export type CompetitionSearchResult = {
  competitions: CompetitionSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CompetitionClass = {
  id: string;
  name: string;
  scoringMethod?: string;
  type?: string;
  gender?: string;
  entryCount?: number;
  teamCount?: number;
  teamSize?: string;
  restrictions: string[];
  rounds: Array<{
    number?: number;
    date?: string;
    firstStartTime?: string;
    courseName?: string;
    holesCount?: number;
  }>;
  isFull?: boolean;
};

export type CompetitionDetail = CompetitionSummary & {
  competitionDate?: string;
  entryDates?: string;
  firstStart?: string;
  status?: string;
  openFor?: string;
  entryFee?: string;
  greenFeeName?: string;
  greenFee?: string;
  startListPublicationDate?: string;
  contacts: string[];
  noteHtml?: string;
  addressHtml?: string;
  instructionsHtml?: string;
  venueName?: string;
  logoUrl?: string;
  latitude?: string;
  longitude?: string;
  entriesCount: Array<{
    signedUpEntries?: number;
    classType?: string;
  }>;
  classes: CompetitionClass[];
  isPayable?: boolean;
  entryWindowOpen?: boolean;
  showEntryList?: boolean;
  showStartList?: boolean;
  showResultList?: boolean;
  showParticipantList?: boolean;
  playersCanSelectTeeTime?: boolean;
  signUpOptions?: {
    canOnlyBeSignedUpAsSingle?: boolean;
    canOnlyBeSignedUpAsTeam?: boolean;
    canBeSignedUpAsSingleOrTeam?: boolean;
  };
};

export type MinGolfSearchPayload = {
  searchPhrase: string;
  dates: {
    from: string;
    to: string;
    onlyWeekend: boolean;
  };
  selectedClubAndDistrict: {
    option?: "AllClubs";
    clubIds: string[];
    districtId?: string | null;
  };
  classification?: string | null;
  onlyGetFollowedCompetitions: false;
  otherOptions: Record<
    OtherOptionGroup,
    Array<{ group: OtherOptionGroup; id: string; name: "" }>
  >;
  onlyShowScratchCompetitions: false;
  pagination: number;
  sortOption: {
    value: "StartDate";
    sortOrder: "Ascending";
  };
};
