// One address, split the way the database will store it, plus its what3words
// address. Every part is a string so a form can hold it; empty means not given.
export interface AddressValues {
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  // Three words without the leading slashes, for example "filled.count.soap".
  what3words: string;
}

export const EMPTY_ADDRESS: AddressValues = {
  city: "",
  county: "",
  line1: "",
  line2: "",
  postcode: "",
  what3words: "",
};
