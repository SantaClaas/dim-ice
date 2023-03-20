import { html, TemplateResult } from 'lit';
import '../src/dim-ice-app.js';

export default {
  title: 'DimIceApp',
  component: 'dim-ice-app',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  header?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({ header, backgroundColor = 'white' }: ArgTypes) => html`
  <dim-ice-app style="--dim-ice-app-background-color: ${backgroundColor}" .header=${header}></dim-ice-app>
`;

export const App = Template.bind({});
App.args = {
  header: 'My app',
};
