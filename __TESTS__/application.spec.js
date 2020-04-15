
import {get_num_days_apart_in_dates} from "../src/client/js/application";
describe("helper function", () => {
  it("Should return 2", async ()=> {
    expect(get_num_days_apart_in_dates("2020-04-20", "2020-04-22")).toBe(2);
  });
});