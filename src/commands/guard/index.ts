import {
  CacheType,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel
} from 'discord.js';

import {
  DISCORD_GUARD_CLIENT_ID,
  DISCORD_MEMBER_ROLE_ID,
  DISCORD_RAIDS_CATEGORY_ID,
  DISCORD_VALHALLA_CATEGORY_ID
} from '@/utils/constants';
import { discordLogger } from '@/utils/logger';

export const toValhallaCommand = new SlashCommandBuilder()
  .setName('to-valhalla')
  .setDescription('Sends a channel to Valhalla');

export const createRaidChannelCommand = new SlashCommandBuilder()
  .setName('create-raid-channel')
  .setDescription('Creates a raid channel with proper permissions.')
  .addStringOption(option =>
    option
      .setName('channel-name')
      .setDescription('The name of the raid channel to create.')
      .setRequired(true)
  )
  .addUserOption(option =>
    option
      .setName('non-member')
      .setDescription(
        'Anyone who is not a member and needs access to the raid channel.'
      )
      .setRequired(false)
  );

const toValhallaExecute = async (
  interaction: CommandInteraction<CacheType>
) => {
  if (!interaction.channel) {
    console.error('Error: interaction channel not found');
    return;
  }
  try {
    if (
      (interaction.channel as TextChannel).parentId ===
      DISCORD_VALHALLA_CATEGORY_ID
    ) {
      const embed = new EmbedBuilder()
        .setColor('#ff3864')
        .setDescription('This is already in Valhalla!');

      await interaction.followUp({ embeds: [embed] });
    } else {
      (interaction.channel as TextChannel).setParent(
        DISCORD_VALHALLA_CATEGORY_ID
      );

      const embed = new EmbedBuilder()
        .setColor('#ff3864')
        .setDescription('Command executed');

      await interaction.followUp({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err);
    discordLogger('Error caught in valhalla command.', interaction.client);
  }
};

const createRaidChannelExecute = async (
  interaction: CommandInteraction<CacheType>
) => {
  try {
    let channelName = interaction.options.get('channel-name')?.value as string;
    const nonMember = interaction.options.getUser('non-member');

    if (!channelName) {
      await interaction.followUp({
        content: 'You must provide a channel name!',
        ephemeral: true
      });
      return;
    }

    if (!interaction.guild) {
      console.error('Error: interaction guild not found');
      return;
    }

    // checks if channel name has the prefix raid
    if (channelName.substring(0, 4) !== 'raid') {
      channelName = `raid-${channelName}`;
    }

    // creating standard raid channel permissions
    const channelPermissions = [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: DISCORD_GUARD_CLIENT_ID,
        allow: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: DISCORD_MEMBER_ROLE_ID,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ];

    // if non-member is provided, add them to the channel
    if (nonMember) {
      channelPermissions.push({
        id: nonMember.id,
        allow: [PermissionFlagsBits.ViewChannel]
      });
    }

    // create the channel
    const createdChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: DISCORD_RAIDS_CATEGORY_ID,
      permissionOverwrites: channelPermissions
    });

    // send the channel link
    const embed = new EmbedBuilder()
      .setColor('#ff3864')
      .setDescription(`New raid channel, <#${createdChannel.id}> created.`);
    await interaction.followUp({ embeds: [embed], ephemeral: true });
    discordLogger(
      `New raid channel, <#${createdChannel.id}> created by ${interaction.user}.`,
      interaction.client
    );
  } catch (err) {
    console.error(err);
    discordLogger('Error caught create raid channel.', interaction.client);
  }
};

export const executeInteraction = async (
  interaction: CommandInteraction<CacheType>
) => {
  const { commandName } = interaction;

  switch (commandName) {
    case toValhallaCommand.name:
      await toValhallaExecute(interaction);
      break;
    case createRaidChannelCommand.name:
      await createRaidChannelExecute(interaction);
      break;
    default:
      console.error(`Command ${commandName} not found`);
      break;
  }
};
